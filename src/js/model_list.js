/**
 * Created by machenhan on 2018/5/24.
 *
 * Mode list page.
 * List of Models based on corresponding filters
 * @Components: Mode list Table, Upload model Button (Condition category page)
 *
 */
import React from 'react'
import '../css/layout.css';
import { Button, Table, Divider, message, Icon} from 'antd';
import getWeb3 from './../utils/getWeb3';
import '../css/index.css'

class ModelList extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            web3: null,
            instance: null,
            modelIdList: [],    // List of Int, model ids
            modelList: [],      // List of Model details
            account: null,
            params: null,
            data: null,
        };

        // Update model list data
        this.getModelList(this.props)

    }// End of constructor


    /*
     * Promise functions
     * @param `prop` (`prop` can be the parent component props, or the props after refresh)
     * 1. Get account
     * 2. If else conditions: fetch list of model IDs based on `param`
     * 3. Get model details of each model ID in the list previously returned,
     *      map them into a list of dictionaries
     *
     * @update use parameter prop fix the bug of crashing when refresh page (caused by lost of contract instance)
     */
    getModelList = (prop) => {
        console.log("We are in model list page, fetching model list");

        const { match: { params } } = prop;
        this.setState({params: params});

        getWeb3.then(results => {
            this.setState({
                web3: results.web3
            });

            let instance;
            results.web3.eth.getAccounts((error, accounts) => {
                instance = prop.instance;
                // console.log("Model List instance", instance, accounts)
                this.setState({account: accounts[0]});
                return accounts[0];
            }).then((result) => {
                // Check the first parameter in the path after "models"
                // If "user", then render a list of model created by that user
                // If "category", then render a list of model in that category
                // If "parent", then render a list of child models of that parent model
                if (params.param==="user"){

                    console.log("User");
                    return instance.get_all_models_by_user.call(result[0], {from: result[0]})
                }else if (params.param==="category"){

                    console.log("category");
                    return instance.get_models_by_category.call(params.paramKey, {from: result[0]})
                }else{

                    console.log("parent");
                    return instance.get_models_by_parent.call(parseInt(params.paramKey), {from: result[0]})
                }
            }).then((result)=>{

                console.log("In model list page trying to get model details from model ID list", result);
                let modelIdList = result;
                this.setState({modelList:[]});      // Reset state, avoid state updated increment multiples
                let index = 0;

                for (let i = 0; i < modelIdList.length; i++) {

                    instance.get_model_all.call(modelIdList[i].c[0]).then((result) => {
                        let map            = {};

                        map["key"]         = index + 1;
                        map["id"]          = result[0].c[0];
                        map["owner"]       = result[1];
                        map["name"]        = result[2];
                        map["accuracy"]    = result[3].c[0] + "%";
                        map["category"]    = result[4];
                        map["price"]       = result[5].c[0];
                        map["parent"]      = result[6].c[0];
                        map["genesis"]     = result[7] === true ? <Icon type="star" /> : null;
                        map["ipfs"]        = result[8];
                        map["level"]       = result[9].c[0];
                        map["description"] = result[10];
                        index += 1;

                        this.setState(previousState => ({
                            modelList: [...previousState.modelList, map]
                        }));

                        console.log("Add this model data to list", map);
                    })
                }
            }).catch((err)=>{
                console.log(err);
                message.error('An error occured when retrieving model lists!');
            })  // End of processing model data
        }) // End of get3 promise
    };


    /* componentWillReceiveProps
     * React.js lifecycle method, used for re-render page when props update
     * @param nextProps is the props after updated
     */
    componentWillReceiveProps(nextProps) {
        console.log('componentWillReceiveProps at model list page', nextProps);
        if (this.props !== nextProps) {
            console.log("The page will be updated with new props");
            this.getModelList(nextProps);
        }
    }


    /* Trigger table filter and sorter event
     *
     */
    onChange = (pagination, filters, sorter) => {
        console.log('params', pagination, filters, sorter);
    };


    /* onClick upload button event
     * Enable user to upload a genesis model
     */
    onClickButton = () =>{
        const { match: { params } } = this.props;
        this.props.history.push({
            pathname: `/upload/${params.paramKey}/0`,
            state: {
                account: this.props.account,
            }
        });
    };


    render(){
        let data = this.state.modelList;        // Model list table data

        // Table column header and settings
        const columns = [{
            title: 'ID',
            dataIndex: 'id',
            sorter: (a, b) => a.id - b.id,
        }, {
            title: 'Name',
            dataIndex: 'name',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.name > b.name,
        }, {
            title: 'Owner',
            dataIndex: 'owner',
            sorter: (a, b) => a.owner > b.owner
        }, {
            title: 'Description',
            dataIndex: 'description',
            sorter: (a, b) => a.description > b.description
        }, {
            title: 'Category',
            dataIndex: 'category',
            sorter: (a, b) => a.category > b.category
        }, {
            title: 'Accuracy',
            dataIndex: 'accuracy',
            sorter: (a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy)
        }, {
            title: 'Price',
            dataIndex: 'price',
            sorter: (a, b) => a.price - b.price
        }, {
            title: 'Genesis',
            dataIndex: 'genesis',
        }];


        return(
            <div className="App">
                {
                    this.props.match.params.param === "user" &&
                        <h2>
                            Models created by {this.props.match.params.paramKey}
                        </h2>
                }
                {
                    this.props.match.params.param === "category" &&
                    <h2>
                        Models of category {this.props.match.params.paramKey}
                    </h2>
                }
                {
                    this.props.match.params.param === "parent" &&
                    <h2>
                        Children Models of {this.props.match.params.paramKey}
                    </h2>
                }
                <Table
                    className='Table'
                    columns={columns}
                    dataSource={data}
                    onChange={this.onChange}
                    onRow={(record) => {
                        const data = record;
                        return {
                            onClick: () =>{
                                console.log("Clicked on row", data, data['id']);
                                this.props.history.push({
                                    pathname: `/model/${data['id']}`,
                                    state: {
                                        account: this.state.account,
                                    }
                                });
                            }
                        };
                    }}
                />

                { this.props.match.params.param === "category" &&
                    <div>
                        <Divider/>
                        <Button type="primary" icon="upload" style={{textAlign: 'center'}} onClick={this.onClickButton.bind(this)} >
                            Click to upload a new genesis model
                        </Button>
                    </div>
                }

            </div>
        )
    }
}

export default ModelList
