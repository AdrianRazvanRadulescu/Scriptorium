import fs from 'node:fs/promises'
import path from 'node:path'

function addLongPathPrefix(filePath: string): string {
  if (process.platform === 'win32' && filePath.length > 240 && !filePath.startsWith('\\\\?\\')) {
    return '\\\\?\\' + filePath
  }
  return filePath
}

export async function writeFileAtomic(targetPath: string, content: string): Promise<void> {
  const resolvedTarget = addLongPathPrefix(targetPath)
  const dir = path.dirname(resolvedTarget)
  const tempPath = resolvedTarget + '.tmp.' + process.hrtime.bigint().toString(36)

  await fs.mkdir(dir, { recursive: true })

  try {
    const fd = await fs.open(tempPath, 'w')
    try {
      await fd.writeFile(content, 'utf-8')
      await fd.sync()
    } finally {
      await fd.close()
    }
    await fs.rename(tempPath, resolvedTarget)
  } catch (error) {
    try {
      await fs.unlink(tempPath)
    } catch {
      // cleanup failure is non-fatal; original error takes priority
    }
    throw error
  }
}
