"use strict";

const chai = require("chai");
const expect = chai.expect;
const RetroCompatibility = require("../lib/retrocompatibility").default;

// Test the Request module methods
describe("RetroCompatibility", function() {
    // Parse from version 0.1.x config
    it("from version 0.1.x", function() {
        let input = {
            registry: {
                search: []
            },
            proget: {
                server: "https://the.website1.com",
                apiKey: "123456789",
                feed: "feedName1",
                group: "bower"
            }
        };
        let expectedOutput = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            },
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https://the.website1.com"
                    }
                ]
            }
        };

        new RetroCompatibility(input);

        expect(input).eql(expectedOutput);
    });

    // Parse from version 0.2.x config
    it("from version 0.2.x", function() {
        let input = {
            registry: {
                search: []
            },
            proget: {
                registries: [
                    "https://the.website1.com/upack/feedName1"
                ],
                apiKeyMapping: [
                    {
                        server: "https://the.website1.com",
                        key: "123456789"
                    }
                ]
            }
        };
        let expectedOutput = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            },
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https://the.website1.com"
                    }
                ]
            }
        };

        new RetroCompatibility(input);

        expect(input).eql(expectedOutput);
    });

    // Parse from version 0.3.x config
    it("from version 0.3.x", function() {
        let input = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            },
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https:\\\\/\\\\/the\\.website1\\.com"
                    }
                ]
            }
        };
        let expectedOutput = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            },
            proget: {
                apiKeyMapping: [
                    {
                        key: "123456789",
                        server: "https:\\\\/\\\\/the\\.website1\\.com",
                        _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website1\\.com")
                    }
                ]
            }
        };

        new RetroCompatibility(input);

        expect(input).eql(expectedOutput);
    });

    // Test request use at step releases
    describe("mixed versions", function() {
        it("from version 0.1.x and 0.2.x", function() {
            let input = {
                registry: {
                    search: []
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            server: "https://the.website2.com",
                            key: "234567890"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    "search": [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2"
                    ]
                },
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
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x and 0.3.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            server: "https://the.website2.com",
                            key: "234567890"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
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
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x, 0.3.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            server: "https://the.website2.com",
                            key: "234567890"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
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
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.3.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    apiKeyMapping: [
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    apiKeyMapping: [
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
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
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x and 0.3.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
                proget: {
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x, 0.3.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            server: "https://the.website2.com",
                            key: "234567890"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "234567890",
                            server: "https://the.website2.com"
                        },
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.2.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    registries: [
                        "https://the.website2.com/upack/feedName2"
                    ],
                    apiKeyMapping: [
                        {
                            server: "https://the.website2.com",
                            key: "234567890"
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website2.com/upack/feedName2",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
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
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.3.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
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
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website3.com/upack/feedName3",
                        "https://the.website4.com/upack/feedName4"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "3456789012",
                            server: "https:\\\\/\\\\/the\\.website3\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website3\\.com")
                        },
                        {
                            key: "456789123",
                            server: "https:the.website4.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });
    });

    describe("duplicated information", function() {
        it("from version 0.1.x and 0.2.x", function() {
            let input = {
                registry: {
                    search: []
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.3.x", function() {
            let input = {
                registry: {
                    search: []
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https:\\\\/\\\\/the\\.website1\\.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https:\\\\/\\\\/the\\.website1\\.com",
                            _serverRegExp: new RegExp("https:\\\\/\\\\/the\\.website1\\.com")
                        },
                        // TODO validate in future if this can cause problem (multiple time the same server)
                        {
                            key: '123456789',
                            server: 'https://the.website1.com'
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });

        it("from version 0.1.x, 0.2.x and 0.4.x", function() {
            let input = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    server: "https://the.website1.com",
                    apiKey: "123456789",
                    feed: "feedName1",
                    group: "bower",
                    registries: [
                        "https://the.website1.com/upack/feedName1"
                    ],
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };
            let expectedOutput = {
                registry: {
                    search: [
                        "https://the.website1.com/upack/feedName1"
                    ]
                },
                proget: {
                    apiKeyMapping: [
                        {
                            key: "123456789",
                            server: "https://the.website1.com"
                        }
                    ]
                }
            };

            new RetroCompatibility(input);

            expect(input.registry.search).to.have.members(expectedOutput.registry.search);
            expect(input.proget.apiKeyMapping).to.deep.have.members(expectedOutput.proget.apiKeyMapping);
            expect(input.proget).to.not.have.any.keys("apiKey", "server", "feed", "group");
            expect(input.proget.apiKeyMapping).to.not.have.any.keys("registries");
        });
    });

    it("no proget section", function() {
        let input = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };
        let expectedOutput = {
            registry: {
                search: [
                    "https://the.website1.com/upack/feedName1"
                ]
            }
        };

        new RetroCompatibility(input);

        expect(input).eql(expectedOutput);
    });
});
