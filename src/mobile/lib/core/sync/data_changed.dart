import 'package:freezed_annotation/freezed_annotation.dart';

part 'data_changed.freezed.dart';

@freezed
abstract class DataChanged with _$DataChanged {
  const factory DataChanged({
    required Set<String> tags,
  }) = _DataChanged;
}
