class Course {
  const Course({
    required this.id,
    required this.title,
    required this.description,
    required this.level,
    required this.orderIndex,
    required this.isPublished,
    this.thumbnailUrl,
    this.estimatedHours,
    this.modules = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      level: json['level'] as String,
      orderIndex: (json['orderIndex'] as num).toInt(),
      isPublished: json['isPublished'] as bool? ?? true,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      estimatedHours: (json['estimatedHours'] as num?)?.toInt(),
      modules: (json['modules'] as List<dynamic>?)
              ?.map((e) => CourseModule.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );
  }

  final String id;
  final String title;
  final String description;
  final String level;
  final int orderIndex;
  final bool isPublished;
  final String? thumbnailUrl;
  final int? estimatedHours;
  final List<CourseModule> modules;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'level': level,
      'orderIndex': orderIndex,
      'isPublished': isPublished,
      'thumbnailUrl': thumbnailUrl,
      'estimatedHours': estimatedHours,
      'modules': modules.map((e) => e.toJson()).toList(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class CourseModule {
  const CourseModule({
    required this.id,
    required this.title,
    required this.description,
    required this.orderIndex,
    required this.courseId,
    this.estimatedHours,
    this.lessons = const [],
    this.course,
    this.createdAt,
    this.updatedAt,
  });

  factory CourseModule.fromJson(Map<String, dynamic> json) {
    return CourseModule(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      orderIndex: (json['orderIndex'] as num).toInt(),
      courseId: json['courseId'] as String,
      estimatedHours: (json['estimatedHours'] as num?)?.toInt(),
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((e) => Lesson.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      course: json['course'] == null
          ? null
          : Course.fromJson(json['course'] as Map<String, dynamic>),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );
  }

  final String id;
  final String title;
  final String description;
  final int orderIndex;
  final String courseId;
  final int? estimatedHours;
  final List<Lesson> lessons;
  final Course? course;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'orderIndex': orderIndex,
      'courseId': courseId,
      'estimatedHours': estimatedHours,
      'lessons': lessons.map((e) => e.toJson()).toList(),
      'course': course?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.description,
    required this.orderIndex,
    required this.moduleId,
    this.estimatedDuration,
    this.createdAt,
    this.updatedAt,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      orderIndex: (json['orderIndex'] as num).toInt(),
      moduleId: json['moduleId'] as String,
      estimatedDuration: (json['estimatedDuration'] as num?)?.toInt(),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );
  }

  final String id;
  final String title;
  final String description;
  final int orderIndex;
  final String moduleId;
  final int? estimatedDuration;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'orderIndex': orderIndex,
      'moduleId': moduleId,
      'estimatedDuration': estimatedDuration,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class UserProgress {
  const UserProgress({
    required this.id,
    required this.status,
    required this.lessonId,
    this.score,
    this.completedAt,
    this.lastAccessedAt,
    this.timeSpent = 0,
    this.lesson,
  });

  factory UserProgress.fromJson(Map<String, dynamic> json) {
    return UserProgress(
      id: json['id'] as String,
      status: json['status'] as String,
      lessonId: json['lessonId'] as String,
      score: (json['score'] as num?)?.toInt(),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
      lastAccessedAt: json['lastAccessedAt'] == null
          ? null
          : DateTime.parse(json['lastAccessedAt'] as String),
      timeSpent: (json['timeSpent'] as num?)?.toInt() ?? 0,
      lesson: json['lesson'] == null
          ? null
          : Lesson.fromJson(json['lesson'] as Map<String, dynamic>),
    );
  }

  final String id;
  final String status;
  final String lessonId;
  final int? score;
  final DateTime? completedAt;
  final DateTime? lastAccessedAt;
  final int timeSpent;
  final Lesson? lesson;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'lessonId': lessonId,
      'score': score,
      'completedAt': completedAt?.toIso8601String(),
      'lastAccessedAt': lastAccessedAt?.toIso8601String(),
      'timeSpent': timeSpent,
      'lesson': lesson?.toJson(),
    };
  }
}
