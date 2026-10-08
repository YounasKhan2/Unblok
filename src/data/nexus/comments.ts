/**
 * NEXUS Enterprise Fixtures: NEXUS_COMMENTS
 */
import { IssueComment } from '../../types';

export const NEXUS_COMMENTS: IssueComment[] = [
  {
    "id": "comm_nex_1",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_1",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_2",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_2",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_1",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_3",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_3",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_4",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_4",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_5",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_5",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_4",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_6",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_6",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_7",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_7",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_8",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_8",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_7",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_9",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_9",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_10",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_10",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_11",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_11",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_10",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_12",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_12",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_13",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_13",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_14",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_14",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_13",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_15",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_15",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_16",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_16",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_17",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_17",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_16",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_18",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_18",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_19",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_19",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_20",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_20",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_19",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_21",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_21",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_22",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_22",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_23",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_23",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_22",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_24",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_24",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_25",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_25",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_26",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_26",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_25",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_27",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_27",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_28",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_28",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_29",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_29",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_28",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_30",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_30",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_31",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_31",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_32",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_32",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_31",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_33",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_33",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_34",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_34",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_35",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_35",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_34",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_36",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_36",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_37",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_37",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_38",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_38",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_37",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_39",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_39",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_40",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_40",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_41",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_41",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_40",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_42",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_42",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_43",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_43",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_44",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_44",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_43",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_45",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_45",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_46",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_46",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_47",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_47",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_46",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_48",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_48",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_49",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_49",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_50",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_50",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_49",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_51",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_51",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_52",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_52",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_53",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_53",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_52",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_54",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_54",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_55",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_55",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_56",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_56",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_55",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_57",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_57",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_58",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_58",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_59",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_59",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_58",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_60",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_60",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_61",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_61",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_62",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_62",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_61",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_63",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_63",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_64",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_64",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_65",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_65",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_64",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_66",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_66",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_67",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_67",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_68",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_68",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_67",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_69",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_69",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_70",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_70",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_71",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_71",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_70",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_72",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_72",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_73",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_73",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_74",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_74",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_73",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_75",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_75",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_76",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_76",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_77",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_77",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_76",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_78",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_78",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_79",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_79",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_80",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_80",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_79",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_81",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_81",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_82",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_82",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_83",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_83",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_82",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_84",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_84",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_85",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_85",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_86",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_86",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_85",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_87",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_87",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_88",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_88",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_89",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_89",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_88",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_90",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_90",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_91",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_91",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_92",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_92",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_91",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_93",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_93",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_94",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_94",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_95",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_95",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_94",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_96",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_96",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_97",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_97",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_98",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_98",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_97",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_99",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_99",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_100",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_100",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_101",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_101",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_100",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_102",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_102",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_103",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_103",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_104",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_104",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_103",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_105",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_105",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_106",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_106",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_107",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_107",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_106",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_108",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_108",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_109",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_109",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_110",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_110",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_109",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_111",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_111",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_112",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_112",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_113",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_113",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_112",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_114",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_114",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_115",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_115",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_116",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_116",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_115",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_117",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_117",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_118",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_118",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_119",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_119",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_118",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_120",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_120",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_121",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_121",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_122",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_122",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_121",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_123",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_123",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_124",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_124",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_125",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_125",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_124",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_126",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_126",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_127",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_127",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_128",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_128",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_127",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_129",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_129",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_130",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_130",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_131",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_131",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_130",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_132",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_132",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_133",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_133",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_134",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_134",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_133",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_135",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_135",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_136",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_136",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_137",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_137",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_136",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_138",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_138",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_139",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_139",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_140",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_140",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_139",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_141",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_141",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_142",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_142",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_143",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_143",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_142",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_144",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_144",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_145",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_145",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_146",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_146",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_145",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_147",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_147",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_148",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_148",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_149",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_149",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_148",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_150",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_150",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_151",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_151",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_152",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_152",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_151",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_153",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_153",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_154",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_154",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_155",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_155",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_154",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_156",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_156",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_157",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_157",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_158",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_158",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_157",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_159",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_159",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_160",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_160",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_161",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_161",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_160",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_162",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_162",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_163",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_163",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_164",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_164",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_163",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_165",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_165",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_166",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_166",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_167",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_167",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_166",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_168",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_168",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_169",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_169",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_170",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_170",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_169",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_171",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_171",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_172",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_172",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_173",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_173",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_172",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_174",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_174",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_175",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_175",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_176",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_176",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_175",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_177",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_177",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_178",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_178",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_179",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_179",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_178",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_180",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_180",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_181",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_181",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_182",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_182",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_181",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_183",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_183",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_184",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_184",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_185",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_185",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_184",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_186",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_186",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_187",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_187",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_188",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_188",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_187",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_189",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_189",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_190",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_190",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_191",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_191",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_190",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_192",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_192",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_193",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_193",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_194",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_194",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_193",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_195",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_195",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_196",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_196",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_197",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_197",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_196",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_198",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_198",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_199",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_199",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_200",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_200",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_199",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_201",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_201",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_202",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_202",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_203",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_203",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_202",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_204",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_204",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_205",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_205",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_206",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_206",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_205",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_207",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_207",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_208",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_208",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_209",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_209",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_208",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_210",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_210",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_211",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_211",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_212",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_212",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_211",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_213",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_213",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_214",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_214",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_215",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_215",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_214",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_216",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_216",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_217",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_217",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_218",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_218",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_217",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_219",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_219",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_220",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_220",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_221",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_221",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_220",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_222",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_222",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_223",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_223",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_224",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_224",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_223",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_225",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_225",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_226",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_226",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_227",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_227",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_226",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_228",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_228",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_229",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_229",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_230",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_230",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_229",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_231",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_231",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_232",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_232",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_233",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_233",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_232",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_234",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_234",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_235",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_235",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_236",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_236",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_235",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_237",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_237",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_238",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_238",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_239",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_239",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_238",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_240",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_240",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_241",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_241",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_242",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_242",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_241",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_243",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_243",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_244",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_244",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_245",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_245",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_244",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_246",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_246",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_247",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_247",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_248",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_248",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_247",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_249",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_249",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_250",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_250",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_251",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_1",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_250",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_252",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_2",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_253",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_3",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_254",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_4",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_253",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_255",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_5",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_256",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_6",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_257",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_7",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_256",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_258",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_8",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_259",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_9",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_260",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_10",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_259",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_261",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_11",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_262",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_12",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_263",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_13",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_262",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_264",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_14",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_265",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_15",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_266",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_16",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_265",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_267",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_17",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_268",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_18",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_269",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_19",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_268",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_270",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_20",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_271",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_21",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_272",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_22",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_271",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_273",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_23",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_274",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_24",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_275",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_25",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_274",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_276",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_26",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_277",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_27",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_278",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_28",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_277",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_279",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_29",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_280",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_30",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_281",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_31",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_280",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_282",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_32",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_283",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_33",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_284",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_34",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_283",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_285",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_35",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_286",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_36",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_287",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_37",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_286",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_288",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_38",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_289",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_39",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_290",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_40",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_289",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_291",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_41",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_292",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_42",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_293",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_43",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_292",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_294",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_44",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_295",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_45",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_296",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_46",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_295",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_297",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_47",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_298",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_48",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_299",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_49",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_298",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_300",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_50",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_301",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_51",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_302",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_52",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_301",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_303",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_53",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_304",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_54",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_305",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_55",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_304",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_306",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_56",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_307",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_57",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_308",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_58",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_307",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_309",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_59",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_310",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_60",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_311",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_61",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_310",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_312",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_62",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_313",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_63",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_314",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_64",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_313",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_315",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_65",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_316",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_66",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_317",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_67",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_316",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_318",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_68",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_319",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_69",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_320",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_70",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_319",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_321",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_71",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_322",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_72",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_323",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_73",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_322",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_324",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_74",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_325",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_75",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_326",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_76",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_325",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_327",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_77",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_328",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_78",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_329",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_79",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_328",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_330",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_80",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_331",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_81",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_332",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_82",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_331",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_333",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_83",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_334",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_84",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_335",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_85",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_334",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_336",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_86",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_337",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_87",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_338",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_88",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_337",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_339",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_89",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_340",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_90",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_341",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_91",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_340",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_342",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_92",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_343",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_93",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_344",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_94",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_343",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_345",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_95",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_346",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_96",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_347",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_97",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_346",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_348",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_98",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_349",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_99",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_350",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_100",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_349",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_351",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_101",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_352",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_102",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_353",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_103",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_352",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_354",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_104",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_355",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_105",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_356",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_106",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_355",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_357",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_107",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_358",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_108",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_359",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_109",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_358",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_360",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_110",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_361",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_111",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_362",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_112",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_361",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_363",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_113",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_364",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_114",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_365",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_115",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_364",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_366",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_116",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_367",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_117",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_368",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_118",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_367",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_369",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_119",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_370",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_120",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_371",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_121",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_370",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_372",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_122",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_373",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_123",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_374",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_124",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_373",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_375",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_125",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_376",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_126",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_377",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_127",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_376",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_378",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_128",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_379",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_129",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_380",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_130",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_379",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_381",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_131",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_382",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_132",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_383",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_133",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_382",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_384",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_134",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_385",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_135",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_386",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_136",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_385",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_387",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_137",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_388",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_138",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_389",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_139",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_388",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_390",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_140",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_391",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_141",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_392",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_142",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_391",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_393",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_143",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_394",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_144",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_395",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_145",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_394",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_396",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_146",
    "authorId": "usr_vikram",
    "authorName": "Vikram Malhotra",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_397",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_147",
    "authorId": "usr_hannah",
    "authorName": "Hannah Schmidt",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_398",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_148",
    "authorId": "usr_tariq",
    "authorName": "Tariq Al-Mansoor",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_397",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_399",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_149",
    "authorId": "usr_maya",
    "authorName": "Maya Lin",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_400",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_150",
    "authorId": "usr_andre",
    "authorName": "Andre Silva",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_401",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_151",
    "authorId": "usr_zoe",
    "authorName": "Zoe Washington",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_400",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_402",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_152",
    "authorId": "usr_felix",
    "authorName": "Felix Weber",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Liam O'Connor Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_liam"
    ]
  },
  {
    "id": "comm_nex_403",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_153",
    "authorId": "usr_devon",
    "authorName": "Devon Brooks",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_404",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_154",
    "authorId": "usr_amara",
    "authorName": "Amara Okafor",
    "authorAvatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_403",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_405",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_155",
    "authorId": "usr_jordan",
    "authorName": "Jordan Taylor",
    "authorAvatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_406",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_156",
    "authorId": "usr_samira",
    "authorName": "Samira Khan",
    "authorAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_407",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_157",
    "authorId": "usr_nathan",
    "authorName": "Nathan Drake",
    "authorAvatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_406",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_408",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_158",
    "authorId": "usr_kevin",
    "authorName": "Kevin Zhao",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_409",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_159",
    "authorId": "usr_sofia",
    "authorName": "Sofia Rossi",
    "authorAvatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_410",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_160",
    "authorId": "usr_rachel",
    "authorName": "Rachel Foster",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_409",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_411",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_161",
    "authorId": "usr_tomas",
    "authorName": "Tomas Novak",
    "authorAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_412",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_162",
    "authorId": "usr_lucas",
    "authorName": "Lucas Moreau",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_413",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_163",
    "authorId": "usr_nadia",
    "authorName": "Nadia Popova",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_412",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_414",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_164",
    "authorId": "usr_diego",
    "authorName": "Diego Morales",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Marcus Vance Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_marcus"
    ]
  },
  {
    "id": "comm_nex_415",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_165",
    "authorId": "usr_yuki",
    "authorName": "Yuki Tanaka",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_416",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_166",
    "authorId": "usr_owen",
    "authorName": "Owen Wright",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Carlos Mendez PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_415",
    "mentions": [
      "usr_carlos"
    ]
  },
  {
    "id": "comm_nex_417",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_167",
    "authorId": "usr_fatima",
    "authorName": "Fatima Zahra",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_418",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_168",
    "authorId": "usr_brendan",
    "authorName": "Brendan Clark",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_419",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_169",
    "authorId": "usr_miriam",
    "authorName": "Miriam Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "content": "@Priya Sharma Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_418",
    "mentions": [
      "usr_priya"
    ]
  },
  {
    "id": "comm_nex_420",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_170",
    "authorId": "usr_artur",
    "authorName": "Artur Hansen",
    "authorAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    "content": "@Felix Weber The double-entry ledger balance reconciled with zero variance across all simulated transactions.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_felix"
    ]
  },
  {
    "id": "comm_nex_421",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_171",
    "authorId": "usr_alex",
    "authorName": "Alex Rivera",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_422",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_172",
    "authorId": "usr_sarah",
    "authorName": "Sarah Chen",
    "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "content": "@Elena Rostova Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_421",
    "mentions": [
      "usr_elena"
    ]
  },
  {
    "id": "comm_nex_423",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_173",
    "authorId": "usr_marcus",
    "authorName": "Marcus Vance",
    "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "content": "@David Kim The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_david"
    ]
  },
  {
    "id": "comm_nex_424",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_174",
    "authorId": "usr_elena",
    "authorName": "Elena Rostova",
    "authorAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Can we ensure we test token revocation when the user changes password across multiple devices?",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_425",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_175",
    "authorId": "usr_david",
    "authorName": "David Kim",
    "authorAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_424",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_426",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_176",
    "authorId": "usr_priya",
    "authorName": "Priya Sharma",
    "authorAvatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "content": "@Nadia Popova Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_nadia"
    ]
  },
  {
    "id": "comm_nex_427",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_177",
    "authorId": "usr_liam",
    "authorName": "Liam O'Connor",
    "authorAvatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  },
  {
    "id": "comm_nex_428",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_178",
    "authorId": "usr_aisha",
    "authorName": "Aisha Patel",
    "authorAvatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    "content": "@Diego Morales The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "parentId": "comm_nex_427",
    "mentions": [
      "usr_diego"
    ]
  },
  {
    "id": "comm_nex_429",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_179",
    "authorId": "usr_carlos",
    "authorName": "Carlos Mendez",
    "authorAvatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    "content": "@Sarah Chen Accessibility audit passed with zero violations in axe-core automated regression run.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_sarah"
    ]
  },
  {
    "id": "comm_nex_430",
    "workspaceId": "ws_nexus",
    "issueId": "iss_nex_180",
    "authorId": "usr_chloe",
    "authorName": "Chloe Dubois",
    "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "content": "@Alex Rivera Security audit sign-off approved. All cryptographic key rotation requirements satisfied.",
    "createdAt": "2026-10-04T12:00:00.000Z",
    "mentions": [
      "usr_alex"
    ]
  }
];
