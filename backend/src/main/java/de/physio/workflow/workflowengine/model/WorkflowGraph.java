package de.physio.workflow.workflowengine.model;

import java.util.*;

public class WorkflowGraph {
    private final Map<String, WfNode> nodesById;
    private final Map<String, List<WfEdge>> outgoingByFrom;

    public WorkflowGraph(Map<String, WfNode> nodesById, Map<String, List<WfEdge>> outgoingByFrom) {
        this.nodesById = nodesById;
        this.outgoingByFrom = outgoingByFrom;
    }

    public WfNode node(String id) { return nodesById.get(id); }
    public List<WfEdge> outgoing(String from) { return outgoingByFrom.getOrDefault(from, List.of()); }

    public String findStartId() {
        return nodesById.values().stream()
                .filter(n -> "START".equalsIgnoreCase(n.type()))
                .map(WfNode::id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No START node found"));
    }
}
