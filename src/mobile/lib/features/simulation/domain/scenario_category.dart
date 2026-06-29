class ScenarioCategory {
  const ScenarioCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
  });

  factory ScenarioCategory.fromJson(Map<String, dynamic> json) {
    return ScenarioCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      icon: json['icon'] as String? ?? 'category',
      color: json['color'] as String? ?? '#6366F1',
    );
  }

  final String id;
  final String name;
  final String description;
  final String icon;
  final String color;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'color': color,
    };
  }
}
