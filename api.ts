import {
  type Span,
  SpanKind,
  context,
  trace,
} from "@opentelemetry/api";
import { Meteor } from "meteor/meteor";

export async function traceAsyncFunc<T>(tracerName: string, spanName: string, func: (span: Span) => Promise<T>) {
  const tracer = trace.getTracer(tracerName);
  const span = tracer.startSpan(spanName, {
    kind: SpanKind.INTERNAL,
  });
  try {
    const spanContext = trace.setSpan(context.active(), span);
    return await context.with(spanContext, () => func(span));
  } catch (err) {
    span.recordException(err as Error);
    throw err;
  } finally {
    span.end();
  }
}

export function tracedInterval<T>(func: (span: Span) => Promise<T>, delayMs: number) {
  const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
  return Meteor.setInterval(() => traceAsyncFunc('async_func', funcName, func), delayMs);
}

export function tracedTimeout<T>(func: (span: Span) => Promise<T>, delayMs: number) {
  const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
  return Meteor.setTimeout(() => traceAsyncFunc('async_func', funcName, func), delayMs);
}
