import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'data_changed.dart';

part 'data_change_bus.g.dart';

@Riverpod(keepAlive: true)
class DataChangeBus extends _$DataChangeBus {
  int _sequence = 0;

  @override
  DataChanged? build() => null;

  void emit(Set<String> tags) {
    // Freezed [DataChanged] uses value equality on [tags]. Repeated emits with the
    // same tag set would compare equal and Riverpod may skip notifying listeners,
    // so tier summaries and other subscribers never refetch. A synthetic tag makes
    // each emission distinct while still intersecting real watch tag sets.
    final stamp = _sequence++;
    state = DataChanged(tags: {...tags, '__emit:$stamp'});
  }
}
