import type { AdminExercise, ContentStatus } from "../exercise-shared";

export type ExerciseRowProps = {
  exercise: AdminExercise;
  onDeleted: () => void;
  onStatusChange: (status: ContentStatus) => void;
  onSaved: () => void;
};
