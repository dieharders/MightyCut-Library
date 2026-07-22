// The static registry barrel — imports every element and registers it. Importing
// this module populates the runtime registry (getComponent / getTreatment). It is
// the single place that wires the library together, and the only import the
// harness build path, the CLI, and the showcase bundle need. Explicit imports (no
// fs glob) so the same barrel works under Bun and the browser bundler.
import { registerComponent, registerTreatment } from "./runtime/registry";

// primitives (leaf components)
import { AgendaItem } from "./primitives/agenda-item";
import { Bar } from "./primitives/bar";
import { Badge } from "./primitives/badge";
import { Caption } from "./primitives/caption";
import { Card } from "./primitives/card";
import { Cta } from "./primitives/cta";
import { Glyph } from "./primitives/glyph";
import { Hud } from "./primitives/hud";
import { Icon } from "./primitives/icon";
import { ListNumber } from "./primitives/list-number";
import { Node } from "./primitives/node";
import { Pill } from "./primitives/pill";
import { Rank } from "./primitives/rank";
import { Reticle } from "./primitives/reticle";
import { Row } from "./primitives/row";
import { Signal } from "./primitives/signal";
import { Slab } from "./primitives/slab";
import { Starburst } from "./primitives/starburst";
import { Stat } from "./primitives/stat";
import { Step } from "./primitives/step";
import { Stripe } from "./primitives/stripe";

// treatments (whole-slide archetypes)
import { Agenda } from "./treatments/agenda";
import { BarRanking } from "./treatments/bar-ranking";
import { Chart } from "./treatments/chart";
import { ClosingPlate } from "./treatments/closing-plate";
import { Comparison } from "./treatments/comparison";
import { Cover } from "./treatments/cover";
import { FeatureCards } from "./treatments/feature-cards";
import { Quote } from "./treatments/quote";
import { StatGrid } from "./treatments/stat-grid";
import { Timeline } from "./treatments/timeline";

for (const c of [Stat, Card, Step, AgendaItem, Bar, Rank, Row, Caption, Pill, Cta, ListNumber, Starburst, Slab, Stripe, Badge, Node, Reticle, Glyph, Signal, Icon, Hud]) {
  registerComponent(c);
}
for (const t of [Cover, FeatureCards, StatGrid, ClosingPlate, Quote, Timeline, Comparison, Chart, BarRanking, Agenda]) {
  registerTreatment(t);
}

export {
  AgendaItem,
  Badge,
  Bar,
  Caption,
  Card,
  Cta,
  Glyph,
  Hud,
  Icon,
  ListNumber,
  Node,
  Pill,
  Rank,
  Reticle,
  Row,
  Signal,
  Slab,
  Starburst,
  Stat,
  Step,
  Stripe,
  Agenda,
  BarRanking,
  Chart,
  ClosingPlate,
  Comparison,
  Cover,
  FeatureCards,
  Quote,
  StatGrid,
  Timeline,
};
