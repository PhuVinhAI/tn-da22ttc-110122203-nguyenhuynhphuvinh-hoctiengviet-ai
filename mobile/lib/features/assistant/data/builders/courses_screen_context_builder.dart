import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../courses/data/courses_providers.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/courses`. Pulls the published courses list
/// from `coursesProvider` so the AI can answer questions like "How many
/// courses are there?" without a tool call.
ScreenContext coursesScreenContextBuilder(Ref ref, RouteMatch match) {
  final coursesAsync = ref.watch(coursesProvider);
  final status = asyncLoadStatus(coursesAsync);

  final data = <String, dynamic>{
    'screenType': 'coursesList',
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(coursesAsync.error);
    data['courseCount'] = 0;
    data['courses'] = const <Map<String, dynamic>>[];
  } else if (status == 'loading') {
    data['courseCount'] = 0;
    data['courses'] = const <Map<String, dynamic>>[];
  } else {
    final courses = coursesAsync.requireValue;
    data['courseCount'] = courses.length;
    data['courses'] = courses.map(courseContextSummary).toList(growable: false);
  }

  return ScreenContext(
    route: match.location,
    displayName: 'Courses',
    barPlaceholder: 'Ask about courses?',
    data: data,
  );
}
