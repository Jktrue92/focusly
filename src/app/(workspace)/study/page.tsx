import { studyLibrary } from "@/lib/study-data";
import { StudyLibrary } from "@/components/study-library";
export default async function Study() {
  return <StudyLibrary {...await studyLibrary()} />;
}
