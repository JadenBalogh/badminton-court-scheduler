import { Court } from '../types/types';
import CourtDisplay from "./court";

type ActiveCourtsProps = {
  courts: Court[];
}

export default function ActiveCourts({ courts }: ActiveCourtsProps) {
  return (
    <div className="relative flex w-full justify-center gap-x-32">
      {
        courts.map((court) => {
          return <CourtDisplay key={court.id} court={court} />
        })
      }
    </div>
  );
}
