package de.physio.workflow.workflowengine.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.entity.WorkflowEventEntity;
import de.physio.workflow.persistence.repository.TaskRepository;
import de.physio.workflow.persistence.repository.WorkflowEventRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.*;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Component
public class WorkflowEngine {

    private static final org.slf4j.Logger LOG =
            org.slf4j.LoggerFactory.getLogger(WorkflowEngine.class);

    private final ObjectMapper objectMapper;
    private final TaskRepository taskRepository;
    private final WorkflowInstanceRepository instanceRepository;
    private final WorkflowEventRepository eventRepository;

    private final GraphParser graphParser = new GraphParser();
    private final ConditionEvaluator evaluator = new ConditionEvaluator();

    public WorkflowEngine(ObjectMapper objectMapper,
                          TaskRepository taskRepository,
                          WorkflowInstanceRepository instanceRepository,
                          WorkflowEventRepository eventRepository) {
        this.objectMapper = objectMapper;
        this.taskRepository = taskRepository;
        this.instanceRepository = instanceRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public void runUntilWaitOrEnd(WorkflowInstanceEntity instance, JsonNode definitionJson) {
        WorkflowGraph graph = graphParser.parse(definitionJson);

        Map<String, Object> ctx = jsonToMap(instance.getContextJson());

        String current = instance.getCurrentNodeId();
        if (current == null || current.isBlank()) {
            current = graph.findStartId();
            instance.setCurrentNodeId(current);
        }

        while (true) {
            LOG.debug("Instance {} entering node {}", instance.getId(), current);

            WfNode node = graph.node(current);
            if (node == null) throw new IllegalStateException("Unknown node: " + current);

            logEvent(instance.getId(), "NODE_ENTERED", current, Map.of("type", node.type()));

            String type = node.type().toUpperCase(Locale.ROOT);

            if ("TASK".equals(type)) {
                createTaskAndWait(instance, node);
                instanceRepository.save(instance);
                return;
            }

            if ("END".equals(type)) {
                instance.setStatus("COMPLETED");
                instance.setUpdatedAt(OffsetDateTime.now());
                instanceRepository.save(instance);
                logEvent(instance.getId(), "INSTANCE_COMPLETED", current, Map.of());
                return;
            }

            // START, XOR, others -> advance via edges
            List<WfEdge> outs = graph.outgoing(current);
            if (outs.isEmpty()) {
                instance.setStatus("FAILED");
                instanceRepository.save(instance);
                throw new IllegalStateException("No outgoing edges from node: " + current);
            }

            String next = pickNext(outs, ctx);
            if (next == null) {
                instance.setStatus("FAILED");
                instanceRepository.save(instance);
                throw new IllegalStateException("No edge condition matched from node: " + current);
            }

            LOG.debug("Edge chosen from {} -> {}", current, next);

            current = next;
            instance.setCurrentNodeId(current);
            instance.setStatus("RUNNING");
            instance.setUpdatedAt(OffsetDateTime.now());
            instanceRepository.save(instance);
        }
    }

    private String pickNext(List<WfEdge> outs, Map<String, Object> ctx) {
        for (WfEdge e : outs) {
            if (evaluator.matches(e.condition(), ctx)) return e.to();
        }
        return null;
    }

    private void createTaskAndWait(WorkflowInstanceEntity instance, WfNode node) {
        TaskEntity t = new TaskEntity();
        t.setInstanceId(instance.getId());
        t.setNodeId(node.id());
        t.setName(node.name() != null ? node.name() : node.id());
        t.setActorRole(node.actorRole() != null ? node.actorRole() : "UNKNOWN");
        t.setContextKey(node.contextKey());
        t.setFormSchema(node.form() == null ? objectMapper.createObjectNode() : node.form());
        t.setStatus("OPEN");
        taskRepository.save(t);

        instance.setStatus("WAITING");
        instance.setUpdatedAt(OffsetDateTime.now());

        logEvent(instance.getId(), "TASK_CREATED", node.id(),
                Map.of("taskId", t.getId(), "actorRole", t.getActorRole()));
    }

    private void logEvent(Long instanceId, String type, String nodeId, Map<String, Object> data) {
        WorkflowEventEntity ev = new WorkflowEventEntity();
        ev.setInstanceId(instanceId);
        ev.setType(type);
        ev.setNodeId(nodeId);
        ev.setData(objectMapper.valueToTree(data));
        eventRepository.save(ev);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(JsonNode node) {
        if (node == null || node.isNull()) return new HashMap<>();
        return objectMapper.convertValue(node, Map.class);
    }

    @Transactional
    public void advanceAfterTask(WorkflowInstanceEntity instance, JsonNode definitionJson) {
        WorkflowGraph graph = graphParser.parse(definitionJson);
        var ctx = jsonToMap(instance.getContextJson());

        String current = instance.getCurrentNodeId();
        if (current == null || current.isBlank()) {
            throw new IllegalStateException("Instance has no current node.");
        }

        // current is a TASK node that was just completed.
        // Move to next node based on outgoing edges + ctx, then continue engine.
        List<WfEdge> outs = graph.outgoing(current);
        if (outs.isEmpty()) {
            instance.setStatus("FAILED");
            instanceRepository.save(instance);
            throw new IllegalStateException("No outgoing edges from TASK node: " + current);
        }

        String next = pickNext(outs, ctx);
        if (next == null) {
            instance.setStatus("FAILED");
            instanceRepository.save(instance);
            throw new IllegalStateException("No edge condition matched from TASK node: " + current);
        }

        instance.setCurrentNodeId(next);
        instance.setStatus("RUNNING");
        instance.setUpdatedAt(OffsetDateTime.now());
        instanceRepository.save(instance);

        // now continue until next TASK or END
        runUntilWaitOrEnd(instance, definitionJson);
    }

}
