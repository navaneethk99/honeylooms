import Link from 'next/link'

import styles from './index.module.css'

export function CustomerNotFound() {
  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Error 404</p>
        <h1 className={styles.heading}>Lost in the weave.</h1>
        <p className={styles.description}>The page you are looking for is not here, or may have moved.</p>
        <div className={styles.links}>
          <Link className={styles.homeLink} href="/">
            Home
          </Link>
          <Link className={styles.shopLink} href="/shop">
            Shop
          </Link>
        </div>
      </div>
    </section>
  )
}
