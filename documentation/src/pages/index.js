import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — Documentation`}
      description="Documentation technique et utilisateur du projet InstaClone — SAÉ 5.02 BUT R&T">
      <div className={styles.hero}>
        <h1 className={styles.title}>InstaClone</h1>
        <p className={styles.subtitle}>
          SAÉ 5.02 — Pilotez un projet informatique<br/>
          BUT R&T 3ème année
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/installation/prerequis">
            📦 Installation
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/utilisateur/introduction">
            📖 Guide utilisateur
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/technique/architecture">
            🔧 Documentation technique
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/gestion-projet/scrum">
            📋 Gestion de projet
          </Link>
        </div>
      </div>
      <div className={styles.team}>
        <h2>Équipe</h2>
        <div className={styles.teamGrid}>
          <div className={styles.teamCard}><strong>Yanis</strong><span>Chef de Projet / Dev</span></div>
          <div className={styles.teamCard}><strong>Thomas</strong><span>Scrum Master / Dev</span></div>
          <div className={styles.teamCard}><strong>Guillaume</strong><span>Product Owner / Dev</span></div>
          <div className={styles.teamCard}><strong>Eren</strong><span>Responsable Front-End / Dev</span></div>
          <div className={styles.teamCard}><strong>Mathias</strong><span>Responsable Back-End / Dev</span></div>
          <div className={styles.teamCard}><strong>Enes</strong><span>Responsable Test / Dev</span></div>
          <div className={styles.teamCard}><strong>Mathéo</strong><span>Développeur (Admin)</span></div>
          <div className={styles.teamCard}><strong>Tanguy</strong><span>Développeur (Filtres)</span></div>
          <div className={styles.teamCard}><strong>Jonathan</strong><span>Développeur (Retouche)</span></div>
          <div className={styles.teamCard}><strong>Pierre</strong><span>Développeur (DB)</span></div>
        </div>
      </div>
    </Layout>
  );
}
