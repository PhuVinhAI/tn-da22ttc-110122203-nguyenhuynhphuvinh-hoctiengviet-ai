import 'package:dio/dio.dart';

class ResponseUnwrapInterceptor extends Interceptor {
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final data = response.data;

    if (data is Map<String, dynamic> && data.containsKey('data')) {
      // Skip unwrap for paginated responses (preserve meta)
      if (data.containsKey('meta')) {
        return handler.next(response);
      }

      response.data = data['data'];
    }

    handler.next(response);
  }
}
