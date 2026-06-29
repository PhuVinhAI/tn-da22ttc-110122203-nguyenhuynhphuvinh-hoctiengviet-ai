class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    this.nativeLanguage,
    this.currentLevel,
    this.emailVerified = false,
    this.onboardingCompleted = false,
    this.roles = const [],
    this.createdAt,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      nativeLanguage: json['nativeLanguage'] as String?,
      currentLevel: json['currentLevel'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
      onboardingCompleted: json['onboardingCompleted'] as bool? ?? false,
      roles: (json['roles'] as List<dynamic>?)
              ?.map((e) => UserRole.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String email;
  final String fullName;
  final String? nativeLanguage;
  final String? currentLevel;
  final bool emailVerified;
  final bool onboardingCompleted;
  final List<UserRole> roles;
  final DateTime? createdAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'nativeLanguage': nativeLanguage,
      'currentLevel': currentLevel,
      'emailVerified': emailVerified,
      'onboardingCompleted': onboardingCompleted,
      'roles': roles.map((e) => e.toJson()).toList(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

class UserRole {
  const UserRole({
    required this.name,
    this.permissions = const [],
  });

  factory UserRole.fromJson(Map<String, dynamic> json) {
    return UserRole(
      name: json['name'] as String,
      permissions: (json['permissions'] as List<dynamic>?)
              ?.map((e) => e is String ? e : (e['name'] as String? ?? ''))
              .toList() ??
          const [],
    );
  }

  final String name;
  final List<String> permissions;

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'permissions': permissions,
    };
  }
}

class AuthResponse {
  const AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    this.message,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      expiresIn: (json['expires_in'] as num).toInt(),
      message: json['message'] as String?,
    );
  }

  final AuthUser user;
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final String? message;

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'expires_in': expiresIn,
      'message': message,
    };
  }
}

class TokenResponse {
  const TokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      expiresIn: (json['expires_in'] as num).toInt(),
    );
  }

  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'expires_in': expiresIn,
    };
  }
}

class MessageResponse {
  const MessageResponse({required this.message});

  factory MessageResponse.fromJson(Map<String, dynamic> json) {
    return MessageResponse(message: json['message'] as String);
  }

  final String message;

  Map<String, dynamic> toJson() {
    return {'message': message};
  }
}

class ResetCodeResponse {
  const ResetCodeResponse({required this.resetToken, required this.message});

  factory ResetCodeResponse.fromJson(Map<String, dynamic> json) {
    return ResetCodeResponse(
      resetToken: json['reset_token'] as String,
      message: json['message'] as String,
    );
  }

  final String resetToken;
  final String message;

  Map<String, dynamic> toJson() {
    return {'reset_token': resetToken, 'message': message};
  }
}
