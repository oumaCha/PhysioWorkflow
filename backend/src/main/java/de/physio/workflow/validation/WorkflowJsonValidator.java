package de.physio.workflow.validation;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class WorkflowJsonValidator {

    public void validateOrThrow(JsonNode root) {
        if (root == null || root.isNull()) {
            throw bad("definitionJson must not be null");
        }

        JsonNode nodes = root.get("nodes");
        if (nodes == null || !nodes.isArray() || nodes.isEmpty()) {
            throw bad("definitionJson.nodes must be a non-empty array");
        }

        JsonNode edges = root.get("edges");
        if (edges == null || !edges.isArray()) {
            throw bad("definitionJson.edges must be an array (can be empty)");
        }

        Set<String> nodeIds = new HashSet<>();
        for (JsonNode n : nodes) {
            String id = text(n, "id");
            if (id == null || id.isBlank()) throw bad("Every node must have a non-empty 'id'");
            if (!nodeIds.add(id)) throw bad("Duplicate node id: " + id);

            String type = text(n, "type");
            if (type == null || type.isBlank()) throw bad("Node '" + id + "' must have a non-empty 'type'");
        }

        for (JsonNode e : edges) {
            String from = text(e, "from");
            String to = text(e, "to");

            if (from == null || from.isBlank()) throw bad("Every edge must have a non-empty 'from'");
            if (to == null || to.isBlank()) throw bad("Every edge must have a non-empty 'to'");

            if (!nodeIds.contains(from)) throw bad("Edge 'from' references unknown node id: " + from);
            if (!nodeIds.contains(to)) throw bad("Edge 'to' references unknown node id: " + to);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v != null && v.isTextual()) ? v.asText() : null;
    }

    private IllegalArgumentException bad(String msg) {
        return new IllegalArgumentException("Invalid workflow definition JSON: " + msg);
    }
}
