var should   = require('should'),
    sinon    = require('sinon'),
    rewire   = require('rewire'),

// Stuff we are testing
    templates = rewire('../../../../server/controllers/frontend/templates'),
    themes = require('../../../../server/themes'),

    sandbox = sinon.sandbox.create();

describe('templates', function () {
    var getActiveThemeStub, hasTemplateStub;

    afterEach(function () {
        sandbox.restore();
    });

    describe('[private] getChannelTemplateHierarchy', function () {
        var channelTemplateList = templates.__get__('getChannelTemplateHierarchy');

        it('should return just index for empty channelOpts', function () {
            channelTemplateList({}).should.eql(['index']);
        });

        it('should return just index if channel name is index', function () {
            channelTemplateList({name: 'index'}).should.eql(['index']);
        });

        it('should return just index if channel name is index even if slug is set', function () {
            channelTemplateList({name: 'index', slugTemplate: true, slugParam: 'test'}).should.eql(['index']);
        });

        it('should return channel, index if channel has name', function () {
            channelTemplateList({name: 'tag'}).should.eql(['tag', 'index']);
        });

        it('should return channel-slug, channel, index if channel has name & slug + slugTemplate set', function () {
            channelTemplateList({name: 'tag', slugTemplate: true, slugParam: 'test'}).should.eql(['tag-test', 'tag', 'index']);
        });

        it('should return front, channel-slug, channel, index if name, slugParam+slugTemplate & frontPageTemplate+pageParam=1 is set', function () {
            channelTemplateList({
                name: 'tag', slugTemplate: true, slugParam: 'test', frontPageTemplate: 'front-tag', postOptions: {page: 1}
            }).should.eql(['front-tag', 'tag-test', 'tag', 'index']);
        });

        it('should return home, index for index channel if front is set and pageParam = 1', function () {
            channelTemplateList({name: 'index', frontPageTemplate: 'home', postOptions: {page: 1}}).should.eql(['home', 'index']);
        });
    });

    describe('pickTemplate', function () {
        beforeEach(function () {
            hasTemplateStub = sandbox.stub().returns(false);

            getActiveThemeStub = sandbox.stub(themes, 'getActive').returns({
                hasTemplate: hasTemplateStub
            });
        });

        it('returns fallback if there is no activeTheme', function () {
            getActiveThemeStub.returns(undefined);

            templates.pickTemplate(['tag-test', 'tag', 'index'], 'fallback').should.eql('fallback');
            templates.pickTemplate(['page-my-post', 'page', 'post'], 'fallback').should.eql('fallback');
        });

        it('returns fallback if activeTheme has no templates', function () {
            templates.pickTemplate(['tag-test', 'tag', 'index'], 'fallback').should.eql('fallback');
            templates.pickTemplate(['page-about', 'page', 'post'], 'fallback').should.eql('fallback');
        });

        describe('with many templates', function () {
            beforeEach(function () {
                // Set available Templates
                hasTemplateStub.withArgs('default').returns(true);
                hasTemplateStub.withArgs('index').returns(true);
                hasTemplateStub.withArgs('page').returns(true);
                hasTemplateStub.withArgs('page-about').returns(true);
                hasTemplateStub.withArgs('post').returns(true);
                hasTemplateStub.withArgs('amp').returns(true);
            });

            it('returns first matching template', function () {
                templates.pickTemplate(['page-about', 'page', 'post'], 'fallback').should.eql('page-about');
                templates.pickTemplate(['page-magic', 'page', 'post'], 'fallback').should.eql('page');
                templates.pickTemplate(['page', 'post'], 'fallback').should.eql('page');
            });

            it('returns correctly if template list is a string', function () {
                templates.pickTemplate('amp', 'fallback').should.eql('amp');
                templates.pickTemplate('subscribe', 'fallback').should.eql('fallback');
                templates.pickTemplate('post', 'fallback').should.eql('post');
            });
        });
    });

    describe('single', function () {
        beforeEach(function () {
            hasTemplateStub = sandbox.stub().returns(false);

            getActiveThemeStub = sandbox.stub(themes, 'getActive').returns({
                hasTemplate: hasTemplateStub
            });
        });

        describe('with many templates', function () {
            beforeEach(function () {
                // Set available Templates
                hasTemplateStub.withArgs('default').returns(true);
                hasTemplateStub.withArgs('index').returns(true);
                hasTemplateStub.withArgs('page').returns(true);
                hasTemplateStub.withArgs('page-about').returns(true);
                hasTemplateStub.withArgs('post').returns(true);
            });

            it('will return correct template for a post WITHOUT custom template', function () {
                var view = templates.single({
                    page: 0,
                    slug: 'test-post'
                });
                should.exist(view);
                view.should.eql('post');
            });

            it('will return correct template for a post WITH custom template', function () {
                hasTemplateStub.withArgs('post-welcome-to-ghost').returns(true);
                var view = templates.single({
                    page: 0,
                    slug: 'welcome-to-ghost'
                });
                should.exist(view);
                view.should.eql('post-welcome-to-ghost', 'post');
            });

            it('will return correct template for a page WITHOUT custom template', function () {
                var view = templates.single({
                    page: 1,
                    slug: 'contact'
                });
                should.exist(view);
                view.should.eql('page');
            });

            it('will return correct template for a page WITH custom template', function () {
                var view = templates.single({
                    page: 1,
                    slug: 'about'
                });
                should.exist(view);
                view.should.eql('page-about');
            });
        });

        it('will fall back to post even if no index.hbs', function () {
            hasTemplateStub.returns(false);

            var view = templates.single({page: 1});
            should.exist(view);
            view.should.eql('post');
        });
    });

    describe('channel', function () {
        beforeEach(function () {
            hasTemplateStub = sandbox.stub().returns(false);

            getActiveThemeStub = sandbox.stub(themes, 'getActive').returns({
                hasTemplate: hasTemplateStub
            });
        });

        describe('without tag templates', function () {
            beforeEach(function () {
                hasTemplateStub.withArgs('default').returns(true);
                hasTemplateStub.withArgs('index').returns(true);
            });

            it('will return correct view for a tag', function () {
                var view = templates.channel({name: 'tag', slugParam: 'development', slugTemplate: true});
                should.exist(view);
                view.should.eql('index');
            });
        });

        describe('with tag templates', function () {
            beforeEach(function () {
                hasTemplateStub.withArgs('default').returns(true);
                hasTemplateStub.withArgs('index').returns(true);
                hasTemplateStub.withArgs('tag').returns(true);
                hasTemplateStub.withArgs('tag-design').returns(true);
            });

            it('will return correct view for a tag', function () {
                var view = templates.channel({name: 'tag', slugParam: 'design', slugTemplate: true});
                should.exist(view);
                view.should.eql('tag-design');
            });

            it('will return correct view for a tag', function () {
                var view = templates.channel({name: 'tag', slugParam: 'development', slugTemplate: true});
                should.exist(view);
                view.should.eql('tag');
            });
        });

        it('will fall back to index even if no index.hbs', function () {
            var view = templates.channel({name: 'tag', slugParam: 'development', slugTemplate: true});
            should.exist(view);
            view.should.eql('index');
        });
    });
});
