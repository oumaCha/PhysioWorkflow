package de.physio.workflow.workflowengine.model;

import com.fasterxml.jackson.databind.JsonNode;

public record WfNode(
        String id,
        String type,
        String name,
        String actorRole,
        String contextKey,
        JsonNode form
) {}
