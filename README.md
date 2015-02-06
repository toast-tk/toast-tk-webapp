RedPlay - Web App d0.1
=======

# JVM settings
-Dredpepper.webapp.addr
-Dredpepper.webapp.port
-Dredpepper.plugin.dir
-Drus.inspect

# Hello Test Project Creation

### Add red pepper dependencies to the project's pom.xml
```xml
	<dependency>
		<groupId>com.synaptix.redpepper</groupId>
		<artifactId>redpepper-automation</artifactId>
		<version>${redpepper.version}</version>
	</dependency>
```

### Create the swing connector as following:
```java
	public class SwingConnector extends RedPepperSwingFixture {

	    @Inject
	    public SwingConnector(IRepositorySetup repo) {
	        super(repo);
	    }

	    @Check("hello world")
	    public TestResult hello() {
	        try {
	        	System.out.println("hello world");
	        } catch (Exception e) {
	            e.printStackTrace();
	            return new TestResult(e.getCause().getMessage(), ResultKind.ERROR);
	        }
	        return new TestResult();
	    }
	}
```
### Create a scenario.txt file the project resource file with:
```
	|| scenario || swing ||
	| hello world |
```


### Create a Guice module to bind your connector with the framework as following
```java
	public class TestBootModule extends AbstractFixtureModule {
		@Override
		protected void configure() {
			install(new BackendModule());
			bindFixture(SwingConnector.class);		
		}
	}
```

### Create a class "HelloWorldRunner" and make it extends "com.synpatix.redpepper.backend.core.AbstractRunner" and complete it as follows:
```java
	protected HelloWorldRunner() {
		super(Guice.createInjector(new TestBootModule()));
	}
	
	public static void main(String[] args) {
		HelloWorldRunner guiTest = new HelloWorldRunner(); 
		guiTest.run(Arrays.asList("scenario.txt"));
	}
```
