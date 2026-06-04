import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { fileIOQueue } from "@server/lib/jobs/fileIOQueue"
import { computeQueue } from "@server/lib/jobs/computeQueue"


export function setupBullBoard() {
  const serverAdapter = new ExpressAdapter()

  serverAdapter.setBasePath("/api/admin/queues")

  createBullBoard({
    queues: [
      new BullMQAdapter(fileIOQueue, { readOnlyMode: true }),
      new BullMQAdapter(computeQueue, { readOnlyMode: true }),
    ],
    serverAdapter
  })

  return serverAdapter
}