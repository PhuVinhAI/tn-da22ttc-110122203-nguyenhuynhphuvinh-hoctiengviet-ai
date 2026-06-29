class UserProfile {
  const UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    this.nativeLanguage,
    this.currentLevel,
    this.preferredDialect,
    this.avatarUrl,
    this.onboardingCompleted = false,
    this.notificationEnabled = false,
    this.notificationTime = '20:00',
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      nativeLanguage: json['nativeLanguage'] as String?,
      currentLevel: json['currentLevel'] as String?,
      preferredDialect: json['preferredDialect'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      onboardingCompleted: json['onboardingCompleted'] as bool? ?? false,
      notificationEnabled: json['notificationEnabled'] as bool? ?? false,
      notificationTime: json['notificationTime'] as String? ?? '20:00',
    );
  }

  final String id;
  final String email;
  final String fullName;
  final String? nativeLanguage;
  final String? currentLevel;
  final String? preferredDialect;
  final String? avatarUrl;
  final bool onboardingCompleted;
  final bool notificationEnabled;
  final String notificationTime;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'nativeLanguage': nativeLanguage,
      'currentLevel': currentLevel,
      'preferredDialect': preferredDialect,
      'avatarUrl': avatarUrl,
      'onboardingCompleted': onboardingCompleted,
      'notificationEnabled': notificationEnabled,
      'notificationTime': notificationTime,
    };
  }
}
