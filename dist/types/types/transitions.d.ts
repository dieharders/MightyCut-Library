import { z } from "zod";
/** Timing presets — the transition's DURATION in seconds. */
export declare const TIMING_PRESETS: readonly ["short", "medium", "long"];
export type TimingPreset = (typeof TIMING_PRESETS)[number];
export declare const TIMING_SECONDS: Record<TimingPreset, number>;
/** The shared, theme-agnostic transition catalog names. `none` = no transition. */
export declare const TRANSITION_NAMES: readonly ["none", "fade", "rise", "fall", "scale", "pop", "slide-left", "slide-right", "slide-up", "slide-down", "wipe"];
export type TransitionName = (typeof TRANSITION_NAMES)[number];
/** Scene (treatment) transition: whole-page IN at scene start + OUT at scene end. */
export declare const TransitionSpecSchema: z.ZodObject<{
    animIn: z.ZodOptional<z.ZodEnum<{
        pop: "pop";
        none: "none";
        fade: "fade";
        rise: "rise";
        fall: "fall";
        scale: "scale";
        "slide-left": "slide-left";
        "slide-right": "slide-right";
        "slide-up": "slide-up";
        "slide-down": "slide-down";
        wipe: "wipe";
    }>>;
    animOut: z.ZodOptional<z.ZodEnum<{
        pop: "pop";
        none: "none";
        fade: "fade";
        rise: "rise";
        fall: "fall";
        scale: "scale";
        "slide-left": "slide-left";
        "slide-right": "slide-right";
        "slide-up": "slide-up";
        "slide-down": "slide-down";
        wipe: "wipe";
    }>>;
    timeIn: z.ZodOptional<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
    timeOut: z.ZodOptional<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
}, z.core.$strip>;
export type TransitionSpec = z.infer<typeof TransitionSpecSchema>;
/** Component (leaf) transition: a whole-element entrance only (no exit). */
export declare const ComponentTransitionSchema: z.ZodObject<{
    animIn: z.ZodOptional<z.ZodEnum<{
        pop: "pop";
        none: "none";
        fade: "fade";
        rise: "rise";
        fall: "fall";
        scale: "scale";
        "slide-left": "slide-left";
        "slide-right": "slide-right";
        "slide-up": "slide-up";
        "slide-down": "slide-down";
        wipe: "wipe";
    }>>;
    timeIn: z.ZodOptional<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
}, z.core.$strip>;
export type ComponentTransition = z.infer<typeof ComponentTransitionSchema>;
