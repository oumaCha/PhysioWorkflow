package de.physio.workflow.workflowengine.model;

import org.springframework.expression.spel.support.MapAccessor;
import org.springframework.expression.Expression;
import org.springframework.expression.spel.SpelEvaluationException;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import java.util.Map;

public class ConditionEvaluator {
    private final SpelExpressionParser parser = new SpelExpressionParser();

    public boolean matches(String condition, Map<String, Object> ctx) {
        if (condition == null || condition.isBlank()) return true;

        StandardEvaluationContext ec = new StandardEvaluationContext();
        ec.addPropertyAccessor(new MapAccessor());
        ec.setVariable("ctx", ctx);

        try {
            Expression exp = parser.parseExpression(condition.replace("ctx.", "#ctx."));
            Boolean result = exp.getValue(ec, Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (SpelEvaluationException ex) {
            // ✅ If a key is missing (like redFlags), treat condition as NOT matching
            return false;
        }
    }
}
