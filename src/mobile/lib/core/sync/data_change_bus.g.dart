// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'data_change_bus.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(DataChangeBus)
final dataChangeBusProvider = DataChangeBusProvider._();

final class DataChangeBusProvider
    extends $NotifierProvider<DataChangeBus, DataChanged?> {
  DataChangeBusProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dataChangeBusProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dataChangeBusHash();

  @$internal
  @override
  DataChangeBus create() => DataChangeBus();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DataChanged? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DataChanged?>(value),
    );
  }
}

String _$dataChangeBusHash() => r'cd9d8b518c938b8ef1145cd6981a37a6608746cb';

abstract class _$DataChangeBus extends $Notifier<DataChanged?> {
  DataChanged? build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<DataChanged?, DataChanged?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<DataChanged?, DataChanged?>,
              DataChanged?,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
