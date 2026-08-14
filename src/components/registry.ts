// The static registry barrel — imports every element and registers it. Importing
// this module populates the runtime registry (getComponent / getTreatment). It is
// the single place that wires the library together, and the only import the
// harness build path, the CLI, and the showcase bundle need. Explicit imports (no
// fs glob) so the same barrel works under Bun and the browser bundler.
import { registerComponent, registerTreatment } from "./runtime/registry";

// primitives (leaf components)
import { AgendaItem } from "./primitives/agenda-item";
import { Arch } from "./primitives/arch";
import { Azimuth } from "./primitives/azimuth";
import { Bar } from "./primitives/bar";
import { Badge } from "./primitives/badge";
// `Blob` shadows the platform's `Blob` global in this module — nothing here uses it.
import { Blob } from "./primitives/blob";
import { Caption } from "./primitives/caption";
import { Card } from "./primitives/card";
import { Compass } from "./primitives/compass";
import { Confetti } from "./primitives/confetti";
import { Cta } from "./primitives/cta";
import { Glyph } from "./primitives/glyph";
import { Hud } from "./primitives/hud";
import { Icon } from "./primitives/icon";
import { ListNumber } from "./primitives/list-number";
import { MatrixRow } from "./primitives/matrix-row";
import { ClusterNode } from "./primitives/cluster-node";
import { Plot } from "./primitives/plot";
import { TeamMember } from "./primitives/team-member";
import { Lozenge } from "./primitives/lozenge";
// `NodeDeco`, not `Node` — the bare name would shadow the DOM's `Node` global here.
import { Corner } from "./primitives/corner";
import { Cutout } from "./primitives/cutout";
import { Marker } from "./primitives/marker";
import { NodeDeco } from "./primitives/node";
import { Pill } from "./primitives/pill";
import { Grille } from "./primitives/grille";
import { Keyline } from "./primitives/keyline";
import { Rank } from "./primitives/rank";
import { Reticle } from "./primitives/reticle";
import { Ring } from "./primitives/ring";
import { Row } from "./primitives/row";
import { Signal } from "./primitives/signal";
import { Slab } from "./primitives/slab";
import { Sorts } from "./primitives/sorts";
import { Stamp } from "./primitives/stamp";
import { Starburst } from "./primitives/starburst";
import { Stat } from "./primitives/stat";
import { Step } from "./primitives/step";
import { Stripe } from "./primitives/stripe";
import { Sweep } from "./primitives/sweep";
import { Zag } from "./primitives/zag";

// treatments (whole-slide archetypes)
import { Agenda } from "./treatments/agenda";
import { BarRanking } from "./treatments/bar-ranking";
import { BarChart } from "./treatments/bar-chart";
import { Outro } from "./treatments/outro";
import { Comparison } from "./treatments/comparison";
import { Cover } from "./treatments/cover";
import { FeatureCards } from "./treatments/feature-cards";
import { List } from "./treatments/list";
import { Matrix } from "./treatments/matrix";
import { PillWall } from "./treatments/pill-wall";
import { TrendLine } from "./treatments/trend-line";
import { Cluster } from "./treatments/cluster";
import { Team } from "./treatments/team";
import { Statement } from "./treatments/statement";
import { Stats } from "./treatments/stats";
import { Timeline } from "./treatments/timeline";

for (const c of [Stat, Card, Step, AgendaItem, Bar, Rank, Row, MatrixRow, TeamMember, Plot, ClusterNode, Caption, Pill, Cta, ListNumber, Starburst, Slab, Stripe, Badge, NodeDeco, Reticle, Glyph, Signal, Blob, Lozenge, Arch, Confetti, Ring, Keyline, Corner, Grille, Stamp, Marker, Zag, Cutout, Compass, Sweep, Azimuth, Sorts, Icon, Hud]) {
  registerComponent(c);
}
for (const t of [Cover, List, FeatureCards, Stats, Outro, Statement, Timeline, Comparison, BarChart, BarRanking, Agenda, Matrix, PillWall, Team, TrendLine, Cluster]) {
  registerTreatment(t);
}

export {
  AgendaItem,
  Arch,
  Azimuth,
  Badge,
  Bar,
  Blob,
  Caption,
  Card,
  ClusterNode,
  Compass,
  Confetti,
  Corner,
  Cta,
  Cutout,
  Glyph,
  Grille,
  Hud,
  Icon,
  Keyline,
  ListNumber,
  TrendLine,
  Lozenge,
  Marker,
  Matrix,
  MatrixRow,
  Cluster,
  NodeDeco,
  Pill,
  PillWall,
  Plot,
  Rank,
  Reticle,
  Ring,
  Row,
  Signal,
  Slab,
  Sorts,
  Stamp,
  Starburst,
  Stat,
  Step,
  Stripe,
  Sweep,
  Team,
  TeamMember,
  Zag,
  Agenda,
  BarRanking,
  BarChart,
  Outro,
  Comparison,
  Cover,
  FeatureCards,
  List,
  Statement,
  Stats,
  Timeline,
};
