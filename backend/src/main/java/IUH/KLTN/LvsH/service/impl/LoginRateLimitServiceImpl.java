package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.service.LoginRateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LoginRateLimitServiceImpl implements LoginRateLimitService {

    private final Map<String, AttemptWindow> windows = new ConcurrentHashMap<>();

    @Value("${app.security.auth.login-rate-limit.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.auth.login-rate-limit.window-ms:300000}")
    private long windowMs;

    @Override
    public void assertAllowed(String key) {
        AttemptWindow window = windows.computeIfAbsent(key, ignored -> new AttemptWindow());
        synchronized (window) {
            Instant now = Instant.now();
            window.prune(now, windowMs);

            if (window.blockedUntil != null && window.blockedUntil.isAfter(now)) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Please try again later.");
            }

            if (window.blockedUntil != null && !window.blockedUntil.isAfter(now)) {
                window.blockedUntil = null;
            }
        }
    }

    @Override
    public void recordFailure(String key) {
        AttemptWindow window = windows.computeIfAbsent(key, ignored -> new AttemptWindow());
        synchronized (window) {
            Instant now = Instant.now();
            window.prune(now, windowMs);
            window.failures.addLast(now);

            if (window.failures.size() >= maxAttempts) {
                window.blockedUntil = now.plus(Duration.ofMillis(windowMs));
            }
        }
    }

    @Override
    public void reset(String key) {
        windows.remove(key);
    }

    private static final class AttemptWindow {
        private final Deque<Instant> failures = new ArrayDeque<>();
        private Instant blockedUntil;

        private void prune(Instant now, long windowMs) {
            Instant threshold = now.minus(Duration.ofMillis(windowMs));
            while (!failures.isEmpty() && failures.peekFirst().isBefore(threshold)) {
                failures.removeFirst();
            }
        }
    }
}