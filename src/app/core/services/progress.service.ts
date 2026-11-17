// Re-export ProgressTrackingService as ProgressService for 100% backward compatibility
export {
  ProgressTrackingService,
  ProgressTrackingService as ProgressService,
  PROGRESS_STORAGE_KEY,
  PROGRESS_STORAGE_KEY_V1,
  LEGACY_STORAGE_KEY_TOPICS,
  LEGACY_STORAGE_KEY_QUIZZES,
  MODULE_TOPIC_REGISTRY,
  TOPIC_ALIASES
} from './progress-tracking.service';
