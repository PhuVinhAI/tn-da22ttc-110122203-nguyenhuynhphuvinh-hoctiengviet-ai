// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'data_changed.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$DataChanged {

 Set<String> get tags;
/// Create a copy of DataChanged
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DataChangedCopyWith<DataChanged> get copyWith => _$DataChangedCopyWithImpl<DataChanged>(this as DataChanged, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DataChanged&&const DeepCollectionEquality().equals(other.tags, tags));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(tags));

@override
String toString() {
  return 'DataChanged(tags: $tags)';
}


}

/// @nodoc
abstract mixin class $DataChangedCopyWith<$Res>  {
  factory $DataChangedCopyWith(DataChanged value, $Res Function(DataChanged) _then) = _$DataChangedCopyWithImpl;
@useResult
$Res call({
 Set<String> tags
});




}
/// @nodoc
class _$DataChangedCopyWithImpl<$Res>
    implements $DataChangedCopyWith<$Res> {
  _$DataChangedCopyWithImpl(this._self, this._then);

  final DataChanged _self;
  final $Res Function(DataChanged) _then;

/// Create a copy of DataChanged
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tags = null,}) {
  return _then(_self.copyWith(
tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as Set<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [DataChanged].
extension DataChangedPatterns on DataChanged {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DataChanged value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DataChanged() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DataChanged value)  $default,){
final _that = this;
switch (_that) {
case _DataChanged():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DataChanged value)?  $default,){
final _that = this;
switch (_that) {
case _DataChanged() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Set<String> tags)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DataChanged() when $default != null:
return $default(_that.tags);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Set<String> tags)  $default,) {final _that = this;
switch (_that) {
case _DataChanged():
return $default(_that.tags);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Set<String> tags)?  $default,) {final _that = this;
switch (_that) {
case _DataChanged() when $default != null:
return $default(_that.tags);case _:
  return null;

}
}

}

/// @nodoc


class _DataChanged implements DataChanged {
  const _DataChanged({required final  Set<String> tags}): _tags = tags;
  

 final  Set<String> _tags;
@override Set<String> get tags {
  if (_tags is EqualUnmodifiableSetView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableSetView(_tags);
}


/// Create a copy of DataChanged
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DataChangedCopyWith<_DataChanged> get copyWith => __$DataChangedCopyWithImpl<_DataChanged>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DataChanged&&const DeepCollectionEquality().equals(other._tags, _tags));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_tags));

@override
String toString() {
  return 'DataChanged(tags: $tags)';
}


}

/// @nodoc
abstract mixin class _$DataChangedCopyWith<$Res> implements $DataChangedCopyWith<$Res> {
  factory _$DataChangedCopyWith(_DataChanged value, $Res Function(_DataChanged) _then) = __$DataChangedCopyWithImpl;
@override @useResult
$Res call({
 Set<String> tags
});




}
/// @nodoc
class __$DataChangedCopyWithImpl<$Res>
    implements _$DataChangedCopyWith<$Res> {
  __$DataChangedCopyWithImpl(this._self, this._then);

  final _DataChanged _self;
  final $Res Function(_DataChanged) _then;

/// Create a copy of DataChanged
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tags = null,}) {
  return _then(_DataChanged(
tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as Set<String>,
  ));
}


}

// dart format on
