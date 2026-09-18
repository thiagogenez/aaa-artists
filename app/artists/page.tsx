import { artists } from "@/data/artists";
import { createPageMetadata } from "@/lib/site";
import ArtistDiscovery from "./ArtistDiscovery";
import styles from "./artists.module.css";

const description =
  "Browse the AAA Artists roster by sound, tempo and moment. Discover trance and techno artists for your event.";

export const metadata = createPageMetadata({
  title: "Electronic Music DJs & Producers",
  description,
  path: "/artists",
  socialTitle: "Artists — AAA Artists",
  imageAlt: "AAA Artists roster",
});

export default function ArtistsPage() {
  const roster = artists.map(({ slug, name, image, soundProfiles }) => ({
    slug,
    name,
    image,
    soundProfiles,
  }));

  return (
    <main className={styles.page}>
      <div className={`site-shell ${styles.shell}`}>
        <header className={styles.header}>
          <h1>Our Artists</h1>
          <p>Explore our roster by sound, tempo and moment.</p>
        </header>

        <ArtistDiscovery artists={roster} />
      </div>
    </main>
  );
}
