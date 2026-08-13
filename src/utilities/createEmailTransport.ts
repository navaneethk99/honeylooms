import { ImapFlow } from 'imapflow'
import nodemailer, { type SendMailOptions, type SentMessageInfo } from 'nodemailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import { Transform, type Readable } from 'stream'

type RawMessageCapture = {
  chunks: Buffer[]
}

const rawMessageCapture = Symbol('rawMessageCapture')

const appendToTitanSent = async (rawMessage: Buffer, user: string, pass: string) => {
  const client = new ImapFlow({
    host: 'imap.titan.email',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  })

  let connected = false

  try {
    await client.connect()
    connected = true

    const mailboxes = await client.list()
    const sentMailbox =
      mailboxes.find(({ specialUse }) => specialUse === '\\Sent') ||
      mailboxes.find(({ path }) => path.toLocaleLowerCase() === 'sent')

    if (!sentMailbox) {
      throw new Error('Titan Sent mailbox was not found')
    }

    const appended = await client.append(sentMailbox.path, rawMessage, ['\\Seen'], new Date())

    if (!appended) {
      throw new Error('Titan IMAP connection closed before the message was appended')
    }
  } finally {
    if (connected) {
      await client.logout()
    }
  }
}

export const createEmailTransport = (options: SMTPConnection.Options) => {
  const transport = nodemailer.createTransport(options)
  const smtpSendMail = transport.sendMail.bind(transport)

  transport.use('stream', (mail, done) => {
    const capture = (mail.data as SendMailOptions & { [rawMessageCapture]?: RawMessageCapture })[
      rawMessageCapture
    ]

    if (capture) {
      mail.message.processFunc((input: Readable) => {
        const tee = new Transform({
          transform(chunk: Buffer | string, encoding, callback) {
            capture.chunks.push(Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(chunk, encoding))
            callback(null, chunk)
          },
        })

        input.once('error', (error) => tee.destroy(error))
        return input.pipe(tee)
      })
    }

    done()
  })

  const sendAndSave = async (message: SendMailOptions): Promise<SentMessageInfo> => {
    const capture: RawMessageCapture = { chunks: [] }
    const messageWithCapture = Object.assign({}, message, { [rawMessageCapture]: capture })
    const result = await smtpSendMail(messageWithCapture)
    const imapUser = options.auth && 'user' in options.auth ? options.auth.user || '' : ''
    const imapPass = options.auth && 'pass' in options.auth ? options.auth.pass || '' : ''

    try {
      await appendToTitanSent(Buffer.concat(capture.chunks), imapUser, imapPass)
    } catch (error) {
      console.error('Email was sent, but it could not be saved to the Titan Sent folder.', error)
    }

    return result
  }

  transport.sendMail = ((message: SendMailOptions, callback?: (error: Error | null, info: SentMessageInfo) => void) => {
    const promise = sendAndSave(message)

    if (callback) {
      promise.then(
        (info) => callback(null, info),
        (error) => callback(error, undefined as unknown as SentMessageInfo),
      )
      return
    }

    return promise
  }) as typeof transport.sendMail

  return transport
}
