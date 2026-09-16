import {
  Box,
  Card,
  Column,
  LazyColumn,
  LinearProgressIndicator,
  ListItem,
  Row,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  Shapes,
  size,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { NavRow, SectionHeader } from '@/components/Kit';
import { BrandHero, ON_BRAND_FAINT, ON_BRAND_MUTED } from '@/components/BrandHero';
import { Screen } from '@/components/Screen';
import { Glyph } from '@/components/Glyph';
import { Type } from '@/components/Type';
import { me, stages, thriveMilestones } from '@/data/demo';
import { ACCENTS, BRAND, STAGE_ACCENT } from '@/theme/brand';

export default function JourneyScreen() {
  return (
    <Screen>
      <Journey />
    </Screen>
  );
}

function Journey() {
  const c = useMaterialColors();
  const done = thriveMilestones.filter((m) => m.done).length;
  const order = stages.map((s) => s.id);
  const currentIndex = order.indexOf(me.currentStage);

  return (
    <LazyColumn modifiers={[fillMaxSize(), background(c.surface)]}>
      <BrandHero
        eyebrow="Your journey"
        title={stages[currentIndex].label}
        subtitle={`${done} of ${thriveMilestones.length} milestones · week ${me.weekInStage}`}
      >
        <LinearProgressIndicator
          progress={done / thriveMilestones.length}
          color={BRAND.sun}
          trackColor={ON_BRAND_FAINT}
          modifiers={[fillMaxWidth()]}
        />
        <Type variant="bodySmall" color={ON_BRAND_MUTED}>
          Four stages. Your mentor moves you on when you are ready.
        </Type>
      </BrandHero>

      {stages.map((stage, i) => {
        const accent = STAGE_ACCENT[stage.id];
        if (i === currentIndex) {
          return (
            <Box key={stage.id} modifiers={[padding(16, 4, 16, 4)]}>
              <Card colors={{ containerColor: accent.soft }} modifiers={[fillMaxWidth()]}>
                <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[paddingAll(16)]}>
                  <Row verticalAlignment="center" horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
                    <Type variant="titleLarge" color={accent.strong}>
                      {stage.label}
                    </Type>
                    <Box modifiers={[clip(Shapes.RoundedCorner(12)), background(accent.strong), padding(10, 4, 10, 4)]}>
                      <Type variant="labelMedium" color={BRAND.onBrand}>
                        You are here
                      </Type>
                    </Box>
                  </Row>
                  <Column>
                    {thriveMilestones.map((m) => (
                      <Row key={m.id} verticalAlignment="center" modifiers={[fillMaxWidth()]}>
                        {/*
                          Read-only on purpose: only a mentor marks a milestone
                          complete. A mentee submits evidence from the mission.
                        */}
                        <Box contentAlignment="center" modifiers={[size(40, 40)]}>
                          <Glyph
                            name={m.done ? 'check_circle' : 'radio_button_unchecked'}
                            color={m.done ? accent.strong : c.outline}
                            size={24}
                          />
                        </Box>
                        <Box modifiers={[weight(1)]}>
                          <Type variant="bodyLarge" color={m.done ? c.onSurfaceVariant : c.onSurface}>
                            {m.label}
                          </Type>
                        </Box>
                        {m.due ? (
                          <Type variant="labelLarge" color={BRAND.orange}>
                            {m.due}
                          </Type>
                        ) : null}
                      </Row>
                    ))}
                  </Column>
                </Column>
              </Card>
            </Box>
          );
        }

        const finished = i < currentIndex;
        return (
          <ListItem key={stage.id} colors={{ containerColor: c.surface }}>
            <ListItem.LeadingContent>
              <Box
                contentAlignment="center"
                modifiers={[size(44, 44), clip(Shapes.Circle), background(finished ? accent.strong : accent.soft)]}
              >
                <Glyph name={finished ? 'check' : 'lock'} color={finished ? BRAND.onBrand : accent.strong} size={22} />
              </Box>
            </ListItem.LeadingContent>
            <ListItem.HeadlineContent>
              <Type variant="bodyLarge" color={finished ? c.onSurface : c.onSurfaceVariant}>
                {stage.label}
              </Type>
            </ListItem.HeadlineContent>
            <ListItem.SupportingContent>
              <Type variant="bodyMedium" color={c.onSurfaceVariant}>
                {stage.note}
              </Type>
            </ListItem.SupportingContent>
          </ListItem>
        );
      })}

      <SectionHeader>Keep growing</SectionHeader>
      <NavRow icon="map" tint={ACCENTS[1]} title="Our plan" detail="What you and your mentor are working on" onPress={() => router.push('/mentorship/plan')} />
      <NavRow icon="flag" tint={ACCENTS[0]} title="Goals" detail="Small steps you set yourself" onPress={() => router.push('/goals')} />
      <NavRow icon="event" tint={ACCENTS[2]} title="Activities" detail="Some unlock as you grow" onPress={() => router.push('/activities')} />
    </LazyColumn>
  );
}
