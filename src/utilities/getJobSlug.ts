type SluggableJob = {
  slug?: string | null
  title: string
}

export const getJobSlug = (job: SluggableJob) =>
  job.slug ||
  job.title
    .trim()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
