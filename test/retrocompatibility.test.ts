"use strict";

import {expect} from "chai";
import RetroCompatibility from "../src/retrocompatibility";

// Test the Request module methods
describe("RetroCompatibility", function() {
    // Parse from version 0.1.x config
    it("from version 0.1.x", function() {
        const input = {
            proget: {
                apiKey: "123456789",
                apiKeyMapping: [],
                feed: "feedName1",
                group: "bower",
                server: "https://the.website1.com"
            },
            registry: {
                search: []
            }
        };
        const expectedOutput = {
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https://the.website1.com"
                    }
                ]
            },
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };

        RetroCompatibility.parse(input);

        expect(input).eql(expectedOutput);
    });

    // Parse from version 0.2.x config
    it("from version 0.2.x", function() {
        const input = {
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https://the.website1.com"
                    }
                ],
                registries: [
                    "https://the.website1.com/upack/feedName1"
                ]
            },
            registry: {
                search: []
            }
        };
        const expectedOutput = {
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https://the.website1.com"
                    }
                ]
            },
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };

        RetroCompatibility.parse(input);

        expect(input).eql(expectedOutput);
    });

    // Parse from version 0.3.x config
    it("from version 0.3.x", function() {
        const input = {
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https:\\\\/\\\\/the\\.website1\\.com"
                    }
                ]
            },
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };
        const expectedOutput = {
            proget: {
                apiKeyMapping: [
                    {
                        _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website1\\.com"),
                        key: "123456789",
                        server: "https:\\\\/\\\\/the\\.website1\\.com"
                    }
                ]
            },
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };

        RetroCompatibility.parse(input);

        expect(input).eql(expectedOutput);
    });

    // Test request use at step releases
    describe("mixed versions", function() {
        it("from version 0.1.x and 0.2.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    server: "https://the.website1.com"
                },
                registry: {
                    search: []
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x and 0.3.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    server: "https://the.website1.com"
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x, 0.3.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    server: "https://the.website1.com",

                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.3.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    server: "https://the.website1.com",
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    server: "https://the.website1.com",
                },
                registry: {
                    search: [
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x and 0.3.x", function() {
            const input = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ],
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ]
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x, 0.3.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ],
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ]
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ],
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ]
                },
                registry: {
                    search: [
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.3.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com"),
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });
    });

    describe("duplicated information", function() {
        it("from version 0.1.x and 0.2.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    server: "https://the.website1.com"

                },
                registry: {
                    search: []
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.3.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https:\\\\/\\\\/the\\.website1\\.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    server: "https://the.website1.com"
                },
                registry: {
                    search: []
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website1\\.com"),
                            key: "123456789",
                            server: "https:\\\\/\\\\/the\\.website1\\.com"
                        },
                        // TODO validate in future if this can cause problem (multiple time the same server)
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    server: "https://the.website1.com"
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x and 0.4.x", function() {
            const input = {
                proget: {
                    apiKey: "123456789",
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ],
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    server: "https://the.website1.com"
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };
            const expectedOutput = {
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                },
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                }
            };

            RetroCompatibility.parse(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });
    });

    it("no proget section", function() {
        const input = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };
        const expectedOutput = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };

        RetroCompatibility.parse(input);

        expect(input).eql(expectedOutput);
    });
});
