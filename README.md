RedPlay - Web App d0.1
=======

# Environment pre-requisites:
- sbt 0.13.8
- Scala 2.10.3
- Play 2.2.3
- Java 7
- sbt-plugins: play


# JVM settings
-Dtoast.webapp.addr
-Dtoast.webapp.port

# Hello Test Project Creation

### Add red pepper dependencies to the project's pom.xml
```xml
	<dependency>
		<groupId>com.synaptix.toast</groupId>
		<artifactId>toast-tk-automation-client</artifactId>
		<version>1.3-rc2</version>
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
