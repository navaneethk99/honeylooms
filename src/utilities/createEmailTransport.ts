import { ImapFlow } from 'imapflow'
import nodemailer, { type SendMailOptions, type SentMessageInfo } from 'nodemailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import { Transform, type Readable } from 'stream'

type RawMessageCapture = {
  chunks: Buffer[]
}

type SentMailboxOptions = {
  auth: {
    pass: string
    user: string
  }
  host: string
  port: number
  secure: boolean
}

const rawMessageCapture = Symbol('rawMessageCapture')

const appendToSentMailbox = async (rawMessage: Buffer, options: SentMailboxOptions) => {
  if (rawMessage.length === 0) {
    throw new Error('The sent message could not be captured for IMAP append')
  }

  const client = new ImapFlow({
    ...options,
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
      throw new Error('The IMAP Sent mailbox was not found')
    }

    const appended = await client.append(sentMailbox.path, rawMessage, ['\\Seen'], new Date())

    if (!appended) {
      throw new Error('The IMAP connection closed before the message was appended')
    }
  } finally {
    if (connected) {
      await client.logout()
    }
  }
}

export const createEmailTransport = (
  smtpOptions: SMTPConnection.Options,
  sentMailboxOptions: SentMailboxOptions,
) => {
  const transport = nodemailer.createTransport(smtpOptions)
  const smtpSendMail = transport.sendMail.bind(transport)

  transport.use('stream', (mail, done) => {
    const capture = (mail.data as SendMailOptions & { [rawMessageCapture]?: RawMessageCapture })[
      rawMessageCapture
    ]

    if (capture) {
      mail.message.processFunc((input: Readable) => {
        const tee = new Transform({
          transform(chunk: Buffer | string, encoding, callback) {
            capture.chunks.push(
              Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(chunk, encoding),
            )
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

    try {
      await appendToSentMailbox(Buffer.concat(capture.chunks), sentMailboxOptions)
    } catch (error) {
      console.error('Email was sent, but it could not be saved to the IMAP Sent folder.', error)
    }

    return result
  }

  transport.sendMail = ((
    message: SendMailOptions,
    callback?: (error: Error | null, info: SentMessageInfo) => void,
  ) => {
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
