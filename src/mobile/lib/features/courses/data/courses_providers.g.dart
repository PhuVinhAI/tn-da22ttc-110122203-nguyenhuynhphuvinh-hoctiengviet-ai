// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'courses_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(CourseDetail)
final courseDetailProvider = CourseDetailFamily._();

final class CourseDetailProvider
    extends $AsyncNotifierProvider<CourseDetail, Course> {
  CourseDetailProvider._({
    required CourseDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'courseDetailProvider',
         isAutoDispose: false,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$courseDetailHash();

  @override
  String toString() {
    return r'courseDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  CourseDetail create() => CourseDetail();

  @override
  bool operator ==(Object other) {
    return other is CourseDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$courseDetailHash() => r'70ccbc11a89e5d6b0a6e49046516c1319b689031';

final class CourseDetailFamily extends $Family
    with
        $ClassFamilyOverride<
          CourseDetail,
          AsyncValue<Course>,
          Course,
          FutureOr<Course>,
          String
        > {
  CourseDetailFamily._()
    : super(
        retry: null,
        name: r'courseDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: false,
      );

  CourseDetailProvider call(String id) =>
      CourseDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'courseDetailProvider';
}

abstract class _$CourseDetail extends $AsyncNotifier<Course> {
  late final _$args = ref.$arg as String;
  String get id => _$args;

  FutureOr<Course> build(String id);
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<Course>, Course>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<Course>, Course>,
              AsyncValue<Course>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, () => build(_$args));
  }
}

@ProviderFor(ModuleDetail)
final moduleDetailProvider = ModuleDetailFamily._();

final class ModuleDetailProvider
    extends $AsyncNotifierProvider<ModuleDetail, CourseModule> {
  ModuleDetailProvider._({
    required ModuleDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'moduleDetailProvider',
         isAutoDispose: false,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$moduleDetailHash();

  @override
  String toString() {
    return r'moduleDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  ModuleDetail create() => ModuleDetail();

  @override
  bool operator ==(Object other) {
    return other is ModuleDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$moduleDetailHash() => r'9e9f15d034440536678e3431e4f4ac03fa539d25';

final class ModuleDetailFamily extends $Family
    with
        $ClassFamilyOverride<
          ModuleDetail,
          AsyncValue<CourseModule>,
          CourseModule,
          FutureOr<CourseModule>,
          String
        > {
  ModuleDetailFamily._()
    : super(
        retry: null,
        name: r'moduleDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: false,
      );

  ModuleDetailProvider call(String id) =>
      ModuleDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'moduleDetailProvider';
}

abstract class _$ModuleDetail extends $AsyncNotifier<CourseModule> {
  late final _$args = ref.$arg as String;
  String get id => _$args;

  FutureOr<CourseModule> build(String id);
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<CourseModule>, CourseModule>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<CourseModule>, CourseModule>,
              AsyncValue<CourseModule>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, () => build(_$args));
  }
}
