---
title: TypeBox 类型定义
---

# TypeBox 类型定义

使用 `@sinclair/typebox` 定义 Tool 参数 schema。

## 基础类型

```typescript
import { Type, Optional, Union, Literal } from "@sinclair/typebox";

Type.String()
Type.Number()
Type.Boolean()
Type.Object({})
Type.Array(Type.String())
```

## 可选参数

```typescript
Type.Object({
  name: Type.String(),
  age: Optional(Type.Number())  // 可选
})
```

或带默认值：

```typescript
Type.Object({
  count: Type.Number({ default: 10 })
})
```

## 字符串

```typescript
Type.String({ description: "用户名" })
Type.String({ minLength: 1, maxLength: 100 })
Type.String({ pattern: "^[a-z]+$" })
Type.Format("email")
Type.Format("uri")
```

## 数字

```typescript
Type.Number()
Type.Integer()
Type.Number({ minimum: 0, maximum: 100 })
Type.Number({ default: 50 })
```

## 布尔

```typescript
Type.Boolean()
Type.Boolean({ default: true })
```

## 枚举

```typescript
Type.Union([
  Literal("a"),
  Literal("b"),
  Literal("c")
])

// 或带默认值
Type.Union([
  Literal("a"),
  Literal("b")
], { default: "a" })
```

## 对象

```typescript
Type.Object({
  id: Type.String(),
  name: Type.String(),
  age: Type.Optional(Type.Number()),
  tags: Type.Array(Type.String()),
  metadata: Type.Object({
    created: Type.String(),
    score: Type.Number()
  })
})
```

## 数组

```typescript
Type.Array(Type.String())
Type.Array(Type.Number())
Type.Array(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  })
)
```

## 完整示例

```typescript
parameters: Type.Object({
  // 必填字符串
  query: Type.String({ description: "搜索关键词" }),
  
  // 可选字符串，带默认值
  type: Optional(Type.Union([
    Literal("news"),
    Literal("blog"),
    Literal("all")
  ], { default: "all" })),
  
  // 数字范围
  limit: Type.Number({ 
    description: "返回数量", 
    minimum: 1, 
    maximum: 100, 
    default: 10 
  }),
  
  // 布尔
  adult: Type.Boolean({ 
    description: "包含成人内容",
    default: false 
  }),
  
  // 复杂对象
  filter: Type.Optional(Type.Object({
    dateFrom: Type.String({ format: "date" }),
    dateTo: Type.String({ format: "date" }),
    tags: Type.Array(Type.String())
  })),
  
  // 嵌套数组
  ids: Type.Optional(Type.Array(Type.String()))
})
```

## Schema 验证

```typescript
import { TypeCompiler } from "@sinclair/typebox";

const schema = Type.Object({
  name: Type.String(),
  age: Type.Number()
});

const check = TypeCompiler.Compile(schema);
const result = check({ name: "张三", age: 20 });

if (!result.success) {
  console.log(result.errors);
}
```
