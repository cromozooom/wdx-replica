import { ScrollScenario } from "./scroll-scenario.interface";

export const SCROLL_SCENARIOS: ScrollScenario[] = [
  {
    id: "small-content",
    label: "Small Content - No Scroll",
    description: "Compact JSON that fits entirely without scrollbars",
    containerClass: "editor-small",
    editorMode: "tree",
    sampleData: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      active: true,
      role: "developer",
      settings: {
        theme: "dark",
        notifications: true,
      },
    },
  },
  {
    id: "vertical-scroll",
    label: "Vertical Scroll Only",
    description: "Tall content requiring vertical scrollbar",
    containerClass: "editor-vertical",
    editorMode: "code",
    sampleData: {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        active: i % 2 === 0,
      })),
      metadata: {
        total: 100,
        page: 1,
        pageSize: 100,
      },
    },
  },
  {
    id: "horizontal-scroll",
    label: "Horizontal Scroll Only",
    description: "Wide content with very long strings",
    containerClass: "editor-horizontal",
    editorMode: "code",
    sampleData: {
      apiKey:
        "test_key_51234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_verylongkeythatextendsbeyondnormalviewport",
      endpoint:
        "https://api.example.com/v1/extremely/long/url/path/with/multiple/segments/that/extends/way/beyond/typical/screen/width/for/testing",
      secretToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_extended_with_more_content",
      description:
        "This is a deliberately long description field that contains a significant amount of text without line breaks to force horizontal scrolling behavior in the JSON editor component",
    },
  },
  {
    id: "both-scrollbars",
    label: "Both Scrollbars",
    description: "Tall and wide content requiring both scrollbars",
    containerClass: "editor-both",
    editorMode: "code",
    sampleData: {
      records: Array.from({ length: 80 }, (_, i) => ({
        id: i + 1,
        longFieldName: `This is record ${i + 1} with a very long value that will cause horizontal scrolling when displayed in the editor`,
        anotherLongField: `Another very long content string for record ${i + 1} to ensure horizontal scrolling is triggered`,
        url: `https://example.com/path/to/resource/${i + 1}/with/very/long/segments/to/force/horizontal/scrolling`,
        timestamp: new Date(2026, 1, 25, 10, i % 60, i % 60).toISOString(),
      })),
    },
  },
  {
    id: "deeply-nested",
    label: "Deeply Nested Structures",
    description: "Multiple levels of nesting (best in tree mode)",
    containerClass: "editor-nested",
    editorMode: "tree",
    sampleData: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  level7: {
                    level8: {
                      level9: {
                        level10: {
                          data: "deepest value",
                          properties: ["a", "b", "c"],
                          metadata: {
                            created: "2026-02-25",
                            depth: 10,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      anotherBranch: {
        nested: {
          deeper: {
            evenDeeper: {
              stillGoing: {
                almostThere: {
                  finalLevel: {
                    value: "another deep value",
                    array: [1, 2, 3, 4, 5],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    id: "long-lines",
    label: "Long Single-Line Arrays",
    description: "Arrays with many items causing horizontal scroll",
    containerClass: "editor-long-lines",
    editorMode: "code",
    sampleData: {
      tags: Array.from({ length: 50 }, (_, i) => `tag${i + 1}`),
      longString:
        "A single line of text that goes on and on without any natural breaking points making it necessary to scroll horizontally to see the complete content which is exactly what we want to test in this particular scenario for the JSON editor scroll behavior demonstration",
      ids: Array.from({ length: 100 }, (_, i) => 10000 + i),
      categories: [
        "category-one",
        "category-two",
        "category-three",
        "category-four",
        "category-five",
        "category-six",
        "category-seven",
        "category-eight",
        "category-nine",
        "category-ten",
      ],
    },
  },
];
