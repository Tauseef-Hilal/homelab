import { GetJobOutput } from "@shared/schemas/jobs/response/job.schema";
import { useQuery } from "@tanstack/react-query";
import { getJob } from "../api/getJob";
import { AxiosError } from "axios";
import { ServerError } from "@shared/types/error";

export function useGetJob(id: string) {
  return useQuery<GetJobOutput, AxiosError<ServerError>>({
    queryKey: [id],
    queryFn: () => getJob(id),
  })
}