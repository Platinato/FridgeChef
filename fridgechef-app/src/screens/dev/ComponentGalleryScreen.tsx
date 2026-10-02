import { router } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/AppText';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { TopBar } from '@/components/TopBar';
import { CompositesGallery } from '@/screens/dev/CompositesGallery';
import { PrimitivesGallery } from '@/screens/dev/PrimitivesGallery';

type GalleryTab = 'primitives' | 'composites';

/** Dev-only review surface: every component in all its variants and states (Sprints 02-03). */
export function ComponentGalleryScreen({ initialTab = 'primitives' }: { initialTab?: GalleryTab }) {
  const [tab, setTab] = useState<GalleryTab>(initialTab);
  return (
    <Screen>
      <TopBar
        left={<IconButton icon="back" label="Back" onPress={() => router.back()} />}
        center={<AppText variant="micro">Dev gallery</AppText>}
      />
      <HeroTitle kicker="Design" title="System" />
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'primitives', label: 'Primitives' },
          { id: 'composites', label: 'Composites' },
        ]}
      />
      {tab === 'primitives' ? <PrimitivesGallery /> : <CompositesGallery />}
    </Screen>
  );
}
