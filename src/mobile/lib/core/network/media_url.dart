import 'package:flutter_dotenv/flutter_dotenv.dart';

String resolveMediaUrl(String url) {
  if (url.isEmpty || Uri.tryParse(url)?.hasScheme == true) return url;

  const defineUrl = String.fromEnvironment('API_URL');
  final baseUrl = defineUrl.isNotEmpty
      ? defineUrl
      : dotenv.env['API_URL'] ?? 'http://localhost:3000';
  final normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.substring(0, baseUrl.length - 1)
      : baseUrl;
  final normalizedPath = url.startsWith('/') ? url : '/$url';

  return '$normalizedBase$normalizedPath';
}
