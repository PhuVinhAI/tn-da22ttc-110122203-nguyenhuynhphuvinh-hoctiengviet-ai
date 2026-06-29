import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import 'image_analysis_api.dart';

final imageAnalysisApiProvider = Provider<ImageAnalysisApi>((ref) {
  return ImageAnalysisApi(ref.watch(dioProvider));
});
