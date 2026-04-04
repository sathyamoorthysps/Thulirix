package com.thulirix.service;

import com.thulirix.domain.entity.User;
import com.thulirix.domain.enums.Role;
import com.thulirix.dto.request.LoginRequest;
import com.thulirix.dto.request.RegisterRequest;
import com.thulirix.dto.response.AuthResponse;
import com.thulirix.dto.response.UserResponse;
import com.thulirix.exception.ConflictException;
import com.thulirix.exception.ValidationException;
import com.thulirix.repository.UserRepository;
import com.thulirix.security.UserPrincipal;
import com.thulirix.security.JwtTokenProvider;
import com.thulirix.config.JwtProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ValidationException("User not found after authentication"));
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal.getId());

        log.info("User {} logged in successfully", principal.getEmail());

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new ConflictException("A user with email '" + request.getEmail() + "' already exists");
        }

        Set<Role> roles = request.getRoles() != null && !request.getRoles().isEmpty()
                ? request.getRoles()
                : Set.of(Role.TESTER);

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .displayName(request.getDisplayName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .roles(roles)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        UserPrincipal principal = UserPrincipal.fromUser(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new ValidationException("Invalid or expired refresh token");
        }
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new ValidationException("Provided token is not a refresh token");
        }

        java.util.UUID userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found for refresh token"));

        if (!user.isActive()) {
            throw new ValidationException("User account is deactivated");
        }

        UserPrincipal principal = UserPrincipal.fromUser(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .roles(user.getRoles())
                .active(user.isActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpirationMs() / 1000)
                .user(userResponse)
                .build();
    }
}
