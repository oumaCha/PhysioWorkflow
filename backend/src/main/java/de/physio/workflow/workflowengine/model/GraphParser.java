package de.physio.workflow.workflowengine.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;

public class GraphParser {

    public WorkflowGraph parse(JsonNode root) {
        Map<String, WfNode> nodes = new HashMap<>();
        for (JsonNode n : root.get("nodes")) {
            String id = n.get("id").asText();
            nodes.put(id, new WfNode(
                    id,
                    n.get("type").asText(),
                    n.get("name").isNull() ? null : n.get("name").asText(),
                    n.get("actorRole").isNull() ? null : n.get("actorRole").asText(),
                    n.get("contextKey").isNull() ? null : n.get("contextKey").asText(),
                    n.get("form")
            ));
        }

        Map<String, List<WfEdge>> outgoing = new HashMap<>();
        for (JsonNode e : root.get("edges")) {
            String from = e.get("from").asText();
            String to = e.get("to").asText();
            String cond = (e.get("condition") == null || e.get("condition").isNull()) ? null : e.get("condition").asText();
            outgoing.computeIfAbsent(from, k -> new ArrayList<>()).add(new WfEdge(from, to, cond));
        }
        return new WorkflowGraph(nodes, outgoing);
    }
}
