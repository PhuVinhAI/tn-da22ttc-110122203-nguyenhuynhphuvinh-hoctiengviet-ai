import 'package:flutter/material.dart';

class ScreenUiSnapshot {
  const ScreenUiSnapshot({required this.texts, required this.structure});

  final List<String> texts;
  final Map<String, dynamic> structure;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'texts': texts,
    'structure': structure,
  };

  bool get isEmpty => texts.isEmpty && structure.isEmpty;
}

class ScreenUiSnapshotCollector {
  const ScreenUiSnapshotCollector({
    this.maxDepth = 90,
    this.maxNodes = 4000,
    this.maxTextItems = 500,
    this.maxTextLength = 400,
    this.maxWidgetChildren = 120,
  });

  final int maxDepth;
  final int maxNodes;
  final int maxTextItems;
  final int maxTextLength;
  final int maxWidgetChildren;

  ScreenUiSnapshot collect(BuildContext context) {
    final root = context as Element;
    final texts = <String>[];
    final seenTexts = <String>{};
    var visited = 0;

    List<Map<String, dynamic>> visit(Element element, int depth) {
      if (visited >= maxNodes || depth > maxDepth) return const [];
      visited++;

      final widget = element.widget;
      final node = <String, dynamic>{'type': _widgetType(widget)};

      final role = _widgetRole(widget);
      if (role != null) node['role'] = role;

      final widgetText = _widgetText(widget);
      if (widgetText != null) {
        final text = _cleanText(widgetText);
        if (text.isNotEmpty) {
          node['text'] = text;
          _addText(texts, seenTexts, text);
        }
      }

      final children = <Map<String, dynamic>>[];
      var childCount = 0;
      if (!_isLeaf(widget, node)) {
        element.visitChildElements((child) {
          if (children.length >= maxWidgetChildren) return;
          childCount++;
          children.addAll(visit(child, depth + 1));
        });
      }

      final shouldKeep = _hasUsefulSignal(node) || _isStructuralWidget(widget);
      if (!shouldKeep) return children;

      if (children.isNotEmpty) node['children'] = children;
      if (childCount > children.length) node['childCount'] = childCount;
      return [node];
    }

    final children = visit(root, 0);
    final structure = <String, dynamic>{
      'type': 'screen',
      if (children.isNotEmpty) 'children': children,
    };
    return ScreenUiSnapshot(texts: texts, structure: structure);
  }

  void _addText(List<String> texts, Set<String> seenTexts, String raw) {
    if (texts.length >= maxTextItems) return;
    final text = _cleanText(raw);
    if (text.isEmpty || !seenTexts.add(text)) return;
    texts.add(text);
  }

  String _cleanText(String raw) {
    final compact = raw.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (compact.length <= maxTextLength) return compact;
    return compact.substring(0, maxTextLength).trimRight();
  }

  String _widgetType(Widget widget) => widget.runtimeType.toString();

  String? _widgetRole(Widget widget) {
    if (widget is TextField || widget is TextFormField) return 'input';
    if (widget is TextButton ||
        widget is ElevatedButton ||
        widget is OutlinedButton ||
        widget is IconButton ||
        widget is FloatingActionButton) {
      return 'button';
    }
    if (widget is Checkbox || widget is Switch || widget is Radio) {
      return 'toggle';
    }
    if (widget is Slider) return 'slider';
    if (widget is AppBar) return 'appBar';
    if (widget is BottomNavigationBar || widget is NavigationBar) {
      return 'navigation';
    }
    if (widget is ListTile) return 'listItem';
    if (widget is DropdownButton || widget is DropdownButtonFormField) {
      return 'dropdown';
    }
    if (widget is Semantics) return 'semantics';
    return null;
  }

  bool _isStructuralWidget(Widget widget) {
    if (widget is Scaffold ||
        widget is AppBar ||
        widget is Column ||
        widget is Row ||
        widget is Stack ||
        widget is Wrap ||
        widget is ListView ||
        widget is GridView ||
        widget is CustomScrollView ||
        widget is SingleChildScrollView ||
        widget is PageView ||
        widget is Card ||
        widget is ListTile ||
        widget is Drawer ||
        widget is Dialog ||
        widget is AlertDialog ||
        widget is SimpleDialog ||
        widget is BottomSheet ||
        widget is TabBar ||
        widget is Tab ||
        widget is NavigationBar ||
        widget is NavigationDestination ||
        widget is BottomNavigationBar ||
        widget is Form) {
      return true;
    }

    final type = widget.runtimeType.toString();
    if (type.startsWith('_')) return false;
    return type.endsWith('Screen') ||
        type.endsWith('Page') ||
        type.endsWith('View') ||
        type.endsWith('Section') ||
        type.endsWith('Card') ||
        type.endsWith('Tile') ||
        type.endsWith('Step') ||
        type.endsWith('Panel') ||
        type.endsWith('Sheet') ||
        type.endsWith('Dialog') ||
        type.endsWith('Form') ||
        type.endsWith('Field') ||
        type.endsWith('Button') ||
        type.endsWith('Bar') ||
        type.endsWith('Item');
  }

  bool _isLeaf(Widget widget, Map<String, dynamic> node) {
    if (!node.containsKey('text')) return false;
    return widget is Text ||
        widget is RichText ||
        widget is EditableText ||
        widget is TextField ||
        widget is TextFormField ||
        widget is Tooltip ||
        widget is DropdownMenuItem ||
        widget is ListTile ||
        widget is AppBar;
  }

  String? _widgetText(Widget widget) {
    if (widget is Text) {
      return widget.data ?? widget.textSpan?.toPlainText();
    }
    if (widget is RichText) {
      return widget.text.toPlainText();
    }
    if (widget is EditableText) {
      return widget.controller.text;
    }
    if (widget is Tooltip) {
      return widget.message;
    }
    if (widget is TextField) {
      return _inputText(
        controllerText: widget.controller?.text,
        decoration: widget.decoration,
      );
    }
    if (widget is TextFormField) {
      return widget.controller?.text;
    }
    if (widget is TextButton) return _buttonText(widget.child);
    if (widget is ElevatedButton) return _buttonText(widget.child);
    if (widget is OutlinedButton) return _buttonText(widget.child);
    if (widget is DropdownMenuItem) return _buttonText(widget.child);
    if (widget is ListTile) {
      return [
        _buttonText(widget.title),
        _buttonText(widget.subtitle),
      ].whereType<String>().join(' - ');
    }
    if (widget is AppBar) return _buttonText(widget.title);
    return null;
  }

  String? _inputText({
    required String? controllerText,
    required InputDecoration? decoration,
  }) {
    return [
      decoration?.labelText,
      decoration?.hintText,
      decoration?.helperText,
      controllerText,
    ].whereType<String>().where((part) => part.trim().isNotEmpty).join(' - ');
  }

  String? _buttonText(Widget? child) {
    if (child == null) return null;
    if (child is Text) return child.data ?? child.textSpan?.toPlainText();
    if (child is RichText) return child.text.toPlainText();
    if (child is Icon) return child.semanticLabel;
    if (child is Tooltip) return child.message;
    return null;
  }

  bool _hasUsefulSignal(Map<String, dynamic> node) {
    return node.containsKey('text') ||
        node.containsKey('children') ||
        node.containsKey('role');
  }
}

class ScreenUiSnapshotHost extends StatefulWidget {
  const ScreenUiSnapshotHost({super.key, required this.child});

  final Widget child;

  @override
  ScreenUiSnapshotHostState createState() => ScreenUiSnapshotHostState();
}

class ScreenUiSnapshotHostState extends State<ScreenUiSnapshotHost> {
  static const ScreenUiSnapshotCollector _collector =
      ScreenUiSnapshotCollector();

  ScreenUiSnapshot captureNow() {
    return _collector.collect(context);
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
