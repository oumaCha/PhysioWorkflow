package de.physio.workflow.api;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

    @GetMapping
    public List<Map<String, String>> list() throws IOException {
        Resource[] resources = resolver.getResources("classpath:/workflows/*.json");
        List<Map<String, String>> out = new ArrayList<>();
        for (Resource r : resources) {
            String filename = Objects.requireNonNull(r.getFilename());
            // key = filename without .json
            String key = filename.replaceAll("\\.json$", "");
            out.add(Map.of("key", key, "filename", filename));
        }
        return out;
    }

    @GetMapping(value = "/{key}", produces = MediaType.APPLICATION_JSON_VALUE)
    public String get(@PathVariable String key) throws IOException {
        Resource r = resolver.getResource("classpath:/workflows/" + key + ".json");
        if (!r.exists()) throw new NoSuchElementException("Template not found: " + key);
        try (var in = r.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
