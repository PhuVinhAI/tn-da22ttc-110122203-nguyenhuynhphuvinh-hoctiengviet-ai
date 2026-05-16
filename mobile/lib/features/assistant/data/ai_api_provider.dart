import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import 'ai_api.dart';

/// Production-wired [AiApi] backed by the global Dio instance. Tests can
/// override this provider with a stub that emits scripted events without
/// hitting the network.
final aiApiProvider = Provider<AiApi>((ref) {
  return AiApi(ref.watch(dioProvider));
});
