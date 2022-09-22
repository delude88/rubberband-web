#include <emscripten/bind.h>

#include <string>

using namespace emscripten;

std::string sayHello() {
    return "Hello";
}

/*
class Hello {
public:
    Hello() {};

    string print();
}

Hello::Hello() {}

Hello::print() {
        return "Hello Safari";
}*/


EMSCRIPTEN_BINDINGS(my_module) {
 function("sayHello", &sayHello);
}