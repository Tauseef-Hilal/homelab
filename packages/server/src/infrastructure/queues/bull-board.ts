import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { fileIOQueue } from "@server/lib/jobs/fileIOQueue"
import { thumbnailQueue } from "@server/lib/jobs/thumbnailQueue"


export function setupBullBoard() {
  const serverAdapter = new ExpressAdapter()

  serverAdapter.setBasePath("/api/admin/queues")

  createBullBoard({
    queues: [
      new BullMQAdapter(fileIOQueue, { readOnlyMode: true }),
      new BullMQAdapter(thumbnailQueue, { readOnlyMode: true }),
    ],
    serverAdapter
  })

  return serverAdapter
}